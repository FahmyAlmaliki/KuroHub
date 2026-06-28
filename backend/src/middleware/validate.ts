import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      req.validatedBody = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ');

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message,
          },
        });
        return;
      }
      next(err);
    }
  };
}
