import Fastify from 'fastify';
import { env } from '@/config/env.js';
import { registerPlugins } from '@/plugins/index.js';
import { registerErrorHandler } from '@/middleware/error-handler.js';
import { healthRoutes } from '@/routes/health.js';
import { classifyRoutes } from '@/routes/classify.js';
import { exportRoutes } from '@/routes/export.js';
import { seedSanctions } from '@/infrastructure/db/seed-sanctions.js';

const app = Fastify({ logger: { level: env.LOG_LEVEL } });

await registerPlugins(app);
registerErrorHandler(app);

await app.register(healthRoutes);
await app.register(classifyRoutes);
await app.register(exportRoutes);

process.on('SIGTERM', async () => {
  await app.close();
  process.exit(0);
});

await app.listen({ port: env.PORT, host: '0.0.0.0' });

// Non-blocking — seed sanctions data in background after server is ready
setImmediate(() => {
  seedSanctions().catch((err: Error) => {
    app.log.warn({ err }, '[sanctions-seed] Background seed failed — sanctions screening will use static dual-use list only');
  });
});
