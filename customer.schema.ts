import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

// Catches errors thrown (or passed via next(err)) from any route/controller
// and converts them into a consistent JSON error shape with the right status code.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  // Prisma unique constraint violation, etc.
  if (typeof err === "object" && err !== null && "code" in err) {
    const prismaErr = err as { code?: string; meta?: { target?: string[] } };
    if (prismaErr.code === "P2002") {
      return res.status(409).json({
        error: `Duplicate value for field(s): ${prismaErr.meta?.target?.join(", ")}`,
      });
    }
    if (prismaErr.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error" });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Wraps async route handlers so thrown/rejected errors reach errorHandler
// without needing try/catch in every controller.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
