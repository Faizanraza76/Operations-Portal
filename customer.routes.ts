import { z } from "zod";

const customerBody = z.object({
  name: z.string().min(1),
  mobile: z.string().min(6),
  email: z.string().email().optional().nullable(),
  businessName: z.string().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  customerType: z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]),
  address: z.string().optional().nullable(),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).optional(),
  followUpDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createCustomerSchema = z.object({
  body: customerBody,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateCustomerSchema = z.object({
  body: customerBody.partial(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const idParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const listCustomerQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    search: z.string().optional(),
    status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).optional(),
    customerType: z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const addFollowUpSchema = z.object({
  body: z.object({ note: z.string().min(1) }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});
