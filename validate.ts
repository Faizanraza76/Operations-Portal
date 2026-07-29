import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient";
import { NotFoundError, ConflictError } from "../utils/AppError";

export async function createProduct(req: Request, res: Response) {
  const product = await prisma.product.create({ data: req.body });
  res.status(201).json(product);
}

export async function listProducts(req: Request, res: Response) {
  const { search, category, lowStockOnly, page = 1, pageSize = 20 } = req.query as unknown as {
    search?: string;
    category?: string;
    lowStockOnly?: boolean;
    page?: number;
    pageSize?: number;
  };

  const where: Prisma.ProductWhereInput = {
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // lowStockOnly needs a raw comparison between two columns, which Prisma's
  // query builder can't express directly, so we filter it in JS after fetch
  // for simplicity (fine at this scale; documented as a known limitation).
  const all = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
  });

  const filtered = lowStockOnly
    ? all.filter((p) => p.currentStock <= p.minStock)
    : all;

  const total = filtered.length;
  const items = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

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

export async function getProduct(req: Request, res: Response) {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      stockMovements: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!product) throw new NotFoundError("Product not found");
  res.json(product);
}

export async function updateProduct(req: Request, res: Response) {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw new NotFoundError("Product not found");

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(updated);
}

// Records a manual stock movement (IN or OUT) and updates currentStock atomically.
export async function recordStockMovement(req: Request, res: Response) {
  const { quantity, movementType, reason } = req.body;

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: req.params.id } });
    if (!product) throw new NotFoundError("Product not found");

    if (movementType === "OUT" && product.currentStock < quantity) {
      throw new ConflictError(
        `Insufficient stock for ${product.name}. Available: ${product.currentStock}, requested: ${quantity}`
      );
    }

    const newStock =
      movementType === "IN" ? product.currentStock + quantity : product.currentStock - quantity;

    const updatedProduct = await tx.product.update({
      where: { id: product.id },
      data: { currentStock: newStock },
    });

    const movement = await tx.stockMovement.create({
      data: {
        productId: product.id,
        quantity,
        movementType,
        reason,
        createdById: req.user?.userId,
      },
    });

    return { product: updatedProduct, movement };
  });

  res.status(201).json(result);
}
