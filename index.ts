import { Request, Response } from "express";
import { prisma } from "../prismaClient";
import { NotFoundError } from "../utils/AppError";
import { Prisma } from "@prisma/client";

export async function createCustomer(req: Request, res: Response) {
  const customer = await prisma.customer.create({
    data: {
      ...req.body,
      createdById: req.user?.userId,
    },
  });
  res.status(201).json(customer);
}

export async function listCustomers(req: Request, res: Response) {
  const { search, status, customerType, page = 1, pageSize = 20 } = req.query as unknown as {
    search?: string;
    status?: "LEAD" | "ACTIVE" | "INACTIVE";
    customerType?: "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
    page?: number;
    pageSize?: number;
  };

  const where: Prisma.CustomerWhereInput = {
    ...(status ? { status } : {}),
    ...(customerType ? { customerType } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { mobile: { contains: search, mode: "insensitive" } },
            { businessName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  res.json({
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

export async function getCustomer(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      followUps: { orderBy: { createdAt: "desc" } },
      challans: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!customer) throw new NotFoundError("Customer not found");
  res.json(customer);
}

export async function updateCustomer(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!customer) throw new NotFoundError("Customer not found");

  const updated = await prisma.customer.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(updated);
}

export async function addFollowUp(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!customer) throw new NotFoundError("Customer not found");

  const followUp = await prisma.followUp.create({
    data: {
      customerId: req.params.id,
      note: req.body.note,
      createdById: req.user?.userId,
    },
  });
  res.status(201).json(followUp);
}
