import { Redis } from 'ioredis';
import { env } from '@/config/env';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  // Log but don't crash — app can limp without Redis (just slower, more AI calls)
  console.error('[redis] connection error', err.message);
});
