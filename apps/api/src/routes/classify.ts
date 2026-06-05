import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { resolveHsCode } from '@/domain/classification/resolver.js';
import { createJob, getJobById, listJobs, updateJobStatus, finalizeJob } from '@/repositories/job-repository.js';
import { createResult, getResultsByJobId, applyUserOverride } from '@/repositories/result-repository.js';
import { aiProcess } from '@/infrastructure/ai-service/client.js';
import type { ApiResponse } from '@tradeai/types';

const TextBody = z.object({
  text: z.string().min(3).max(2000),
  originCountry: z.string().max(100).optional(),
  quantity: z.string().max(100).optional(),
  language: z.enum(['en', 'ar']).default('en'),
});

const OverrideBody = z.object({
  resultId: z.string().uuid(),
  hsCode: z.string().regex(/^\d{12}$/, 'HS code must be exactly 12 digits'),
});

const MAX_FILE_MB = 10;
const MB = 1024 * 1024;

export async function classifyRoutes(app: FastifyInstance): Promise<void> {
  // GET /classify — list jobs (must be before /:jobId to avoid route shadowing)
  app.get('/classify', async (req, reply) => {
    const query = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize ?? '20', 10)));
    const offset = (page - 1) * pageSize;
    const { jobs, total } = await listJobs(pageSize, offset);
    return reply.send({ success: true, data: { jobs, total, page, pageSize } });
  });

  // POST /classify/text — sync, single item; creates a job so it appears in history
  app.post('/classify/text', async (req, reply) => {
    const body = TextBody.parse(req.body);
    const job = await createJob({ inputType: 'text', totalItems: 1 });
    try {
      await updateJobStatus(job.id, 'processing', { totalItems: 1 });
      const result = await resolveHsCode(body.text, {
        originCountry: body.originCountry,
        quantity: body.quantity,
        language: body.language,
      });
      await createResult({
        jobId: job.id,
        lineNumber: 1,
        rawDescription: body.text,
        normalizedDescription: body.text,
        result,
      });
      await finalizeJob(job.id, 'completed');
      return reply.send({ success: true, data: { jobId: job.id } } satisfies ApiResponse<{ jobId: string }>);
    } catch (err) {
      await finalizeJob(job.id, 'failed', (err as Error).message);
      throw err;
    }
  });

  // POST /classify/document — creates job, hands off to Python, returns jobId
  app.post('/classify/document', async (req, reply) => {
    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    }

    const ACCEPTED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    if (!ACCEPTED_TYPES.has(data.mimetype)) {
      return reply.status(422).send({ success: false, error: { code: 'INVALID_FILE_TYPE', message: 'Accepted formats: PDF, JPEG, PNG, WebP' } });
    }

    const fileBytes = await data.toBuffer();
    if (fileBytes.length > MAX_FILE_MB * MB) {
      return reply.status(413).send({ success: false, error: { code: 'FILE_TOO_LARGE', message: `File exceeds ${MAX_FILE_MB}MB` } });
    }

    const language = (data.fields['language'] as { value?: string })?.value === 'ar' ? 'ar' : 'en';
    const job = await createJob({ inputType: 'document', fileName: data.filename });

    // Hand off to Python — Python owns all DB writes from here
    const formData = new FormData();
    formData.append('file', new Blob([fileBytes.buffer as ArrayBuffer], { type: data.mimetype }), data.filename ?? 'upload');
    formData.append('language', language);

    aiProcess(job.id, formData).catch((err: Error) => {
      app.log.error({ err, jobId: job.id }, 'Failed to hand off job to AI service');
    });

    return reply
      .status(202)
      .send({ success: true, data: { jobId: job.id, status: 'pending' } } satisfies ApiResponse<{ jobId: string; status: string }>);
  });

  // GET /classify/:jobId — poll job status + results
  app.get('/classify/:jobId', async (req, reply) => {
    const { jobId } = req.params as { jobId: string };
    const job = await getJobById(jobId);
    if (!job) {
      return reply.status(404).send({ success: false, error: { code: 'JOB_NOT_FOUND', message: 'Job not found' } });
    }

    const results = job.status === 'completed' ? await getResultsByJobId(jobId) : [];
    return reply.send({ success: true, data: { job, results } });
  });

  // POST /classify/:jobId/override — user corrects a result
  app.post('/classify/:jobId/override', async (req, reply) => {
    const body = OverrideBody.parse(req.body);
    await applyUserOverride(body.resultId, body.hsCode);
    return reply.send({ success: true, data: { updated: true } });
  });
}
