import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { ClassificationError } from '@/domain/classification/resolver.js';
import { AiServiceError } from '@/infrastructure/ai-service/client.js';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Invalid input' },
      });
    }
    if (error instanceof ClassificationError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    if (error instanceof AiServiceError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    app.log.error({ err: error }, 'Unhandled error');
    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
  });
}
