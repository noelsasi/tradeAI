import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { env } from '@/config/env.js';

export async function registerPlugins(app: FastifyInstance): Promise<void> {
  await app.register(cors, { origin: env.CORS_ORIGIN });
  await app.register(helmet);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
}
