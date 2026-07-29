import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

// Validates req.body/query/params against a zod schema, replacing them with
// the parsed (and type-coerced) result. Throws ZodError -> handled centrally.
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    next();
  };
}
