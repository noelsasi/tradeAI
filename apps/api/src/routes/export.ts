import type { FastifyInstance } from 'fastify';
import { getJobById } from '@/repositories/job-repository.js';
import { getResultsByJobId } from '@/repositories/result-repository.js';
import { buildCsv } from '@/domain/export/csv-builder.js';
import { buildMirsalXml } from '@/domain/export/mirsal-builder.js';

export async function exportRoutes(app: FastifyInstance): Promise<void> {
  // GET /export/:jobId/csv
  app.get('/export/:jobId/csv', async (req, reply) => {
    const { jobId } = req.params as { jobId: string };
    const job = await getJobById(jobId);
    if (!job) {
      return reply.status(404).send({ success: false, error: { code: 'JOB_NOT_FOUND', message: 'Job not found' } });
    }
    if (job.status !== 'completed') {
      return reply.status(409).send({ success: false, error: { code: 'JOB_NOT_COMPLETE', message: 'Job has not completed yet' } });
    }

    const results = await getResultsByJobId(jobId);
    const csv = buildCsv(results);

    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="classification-${jobId}.csv"`)
      .send(csv);
  });

  // GET /export/:jobId/mirsal
  app.get('/export/:jobId/mirsal', async (req, reply) => {
    const { jobId } = req.params as { jobId: string };
    const job = await getJobById(jobId);
    if (!job) {
      return reply.status(404).send({ success: false, error: { code: 'JOB_NOT_FOUND', message: 'Job not found' } });
    }
    if (job.status !== 'completed') {
      return reply.status(409).send({ success: false, error: { code: 'JOB_NOT_COMPLETE', message: 'Job has not completed yet' } });
    }

    const results = await getResultsByJobId(jobId);
    const xml = buildMirsalXml(job, results);

    return reply
      .header('Content-Type', 'application/xml')
      .header('Content-Disposition', `attachment; filename="mirsal2-${jobId}.xml"`)
      .send(xml);
  });
}
