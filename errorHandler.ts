import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient";
import { NotFoundError, ConflictError } from "../utils/AppError";
import * as challanService from "../services/challan.service";

export async function createChallan(req: Request, res: Response) {
  const { customerId, items, status } = req.body as {
    customerId: string;
    items: { productId: string; quantity: number }[];
    status?: "DRAFT" | "CONFIRMED";
  };

  const challan = await challanService.createChallan(
    customerId,
    items,
    status || "DRAFT",
    req.user?.userId
  );
  res.status(201).json(challan);
}

export async function listChallans(req: Request, res: Response) {
  const { status, customerId, page = 1, pageSize = 20 } = req.query as unknown as {
    status?: "DRAFT" | "CONFIRMED" | "CANCELLED";
    customerId?: string;
    page?: number;
    pageSize?: number;
  };

  const where: Prisma.ChallanWhereInput = {
    ...(status ? { status } : {}),
    ...(customerId ? { customerId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.challan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: true, items: true },
    }),
    prisma.challan.count({ where }),
  ]);

  res.json({
    items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function getChallan(req: Request, res: Response) {
  const challan = await prisma.challan.findUnique({
    where: { id: req.params.id },
    include: { customer: true, items: { include: { product: true } } },
  });
  if (!challan) throw new NotFoundError("Challan not found");
  res.json(challan);
}

// Only DRAFT challans may be edited (replaces the item list wholesale).
export async function updateChallan(req: Request, res: Response) {
  const existing = await prisma.challan.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new NotFoundError("Challan not found");
  if (existing.status !== "DRAFT") {
    throw new ConflictError("Only DRAFT challans can be edited");
  }

  const { customerId, items } = req.body as {
    customerId?: string;
    items?: { productId: string; quantity: number }[];
  };

  if (items) {
    // Re-snapshot products and replace items entirely.
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    await prisma.$transaction([
      prisma.challanItem.deleteMany({ where: { challanId: req.params.id } }),
      prisma.challan.update({
        where: { id: req.params.id },
        data: {
          customerId: customerId ?? existing.customerId,
          totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId);
              if (!product) throw new NotFoundError(`Product ${item.productId} not found`);
              return {
                productId: item.productId,
                quantity: item.quantity,
                productNameSnapshot: product.name,
                productSkuSnapshot: product.sku,
                unitPriceSnapshot: product.unitPrice,
              };
            }),
          },
        },
      }),
    ]);
  } else if (customerId) {
    await prisma.challan.update({ where: { id: req.params.id }, data: { customerId } });
  }

  const updated = await prisma.challan.findUnique({
    where: { id: req.params.id },
    include: { customer: true, items: true },
  });
  res.json(updated);
}

export async function confirmChallan(req: Request, res: Response) {
  const challan = await challanService.confirmChallan(req.params.id, req.user?.userId);
  res.json(challan);
}

export async function cancelChallan(req: Request, res: Response) {
  const challan = await challanService.cancelChallan(req.params.id, req.user?.userId);
  res.json(challan);
}
