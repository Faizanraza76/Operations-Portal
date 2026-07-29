import { z } from "zod";

const productBody = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().optional().nullable(),
  unitPrice: z.number().nonnegative(),
  minStock: z.number().int().nonnegative().optional(),
  location: z.string().optional().nullable(),
});

export const createProductSchema = z.object({
  body: productBody,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateProductSchema = z.object({
  body: productBody.partial(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const idParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const listProductQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    lowStockOnly: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const stockMovementSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive(),
    movementType: z.enum(["IN", "OUT"]),
    reason: z.string().min(1),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});
