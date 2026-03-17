import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";

type SchemaMap = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

export function validationMiddleware(schemas: SchemaMap) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
