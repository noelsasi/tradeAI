import { db } from '@/infrastructure/db/client.js';
import type { Job, CreateJobInput } from '@/domain/classification/types.js';

export async function createJob(input: CreateJobInput): Promise<Job> {
  const [job] = await db<Job[]>`
    INSERT INTO classification_jobs (status, input_type, file_name, file_url, total_items)
    VALUES ('pending', ${input.inputType}, ${input.fileName ?? null}, ${input.fileUrl ?? null}, ${input.totalItems ?? 0})
    RETURNING
      id, status, input_type, file_name, file_url,
      total_items, completed_items, error, created_at, updated_at
  `;
  return job;
}

export async function getJobById(id: string): Promise<Job | null> {
  const [job] = await db<Job[]>`
    SELECT
      id, status, input_type, file_name, file_url,
      total_items, completed_items, error, created_at, updated_at
    FROM classification_jobs
    WHERE id = ${id}
  `;
  return job ?? null;
}

export async function updateJobStatus(
  id: string,
  status: Job['status'],
  patch?: { error?: string; totalItems?: number },
): Promise<void> {
  await db`
    UPDATE classification_jobs
    SET
      status = ${status},
      error = ${patch?.error ?? null},
      total_items = COALESCE(${patch?.totalItems ?? null}, total_items),
      updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function incrementCompleted(id: string): Promise<void> {
  await db`
    UPDATE classification_jobs
    SET completed_items = completed_items + 1, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function finalizeJob(id: string, status: 'completed' | 'failed', error?: string): Promise<void> {
  await db`
    UPDATE classification_jobs
    SET status = ${status}, error = ${error ?? null}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function listJobs(limit: number, offset: number): Promise<{ jobs: Job[]; total: number }> {
  const [jobs, [{ total }]] = await Promise.all([
    db<Job[]>`
      SELECT id, status, input_type, file_name, file_url,
             total_items, completed_items, error, created_at, updated_at
      FROM classification_jobs
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    db<{ total: number }[]>`SELECT COUNT(*)::int AS total FROM classification_jobs`,
  ]);
  return { jobs, total };
}
