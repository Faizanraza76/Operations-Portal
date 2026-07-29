import { z } from "zod";

const challanItemInput = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    items: z.array(challanItemInput).min(1, "At least one product is required"),
    status: z.enum(["DRAFT", "CONFIRMED"]).optional(), // defaults to DRAFT
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateChallanSchema = z.object({
  body: z.object({
    customerId: z.string().uuid().optional(),
    items: z.array(challanItemInput).min(1).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const idParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const listChallanQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
    customerId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});
