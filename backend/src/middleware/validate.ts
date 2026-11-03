import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export function validateBody(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const formattedErrors = err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed. Please check the provided fields.',
            details: formattedErrors,
          },
        });
        return;
      }

      next(err);
    }
  };
}
