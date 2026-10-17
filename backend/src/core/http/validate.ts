import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

export const zodValidate =
  <T>(schema: ZodSchema<T>, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.parse(req[source]);
    if (source === 'query') {
      Object.assign(req.query, parsed);
    } else if (source === 'params') {
      Object.assign(req.params, parsed);
    } else {
      req.body = parsed;
    }
    next();
  };
