import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

config({ path: resolve(import.meta.dirname, '../../.env') });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),
});

export const env = EnvSchema.parse(process.env);
