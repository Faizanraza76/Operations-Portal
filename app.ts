import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient";
import { generateChallanNumber } from "../utils/challanNumber";
import { AppError, ConflictError, NotFoundError } from "../utils/AppError";

type ChallanItemInput = { productId: string; quantity: number };

/**
 * Creates a challan as DRAFT or CONFIRMED.
 *
 * Business rules implemented here (per spec):
 * - Each item snapshots product name/SKU/price at creation time, so later
 *   edits to the product catalog don't retroactively change historical challans.
 * - Draft challans do NOT touch stock at all.
 * - Confirmed challans reduce stock immediately, inside the same transaction
 *   that creates the challan, and refuse to go below zero for any item.
 * - If ANY item has insufficient stock, the whole challan creation fails
 *   (all-or-nothing) rather than partially confirming.
 */
export async function createChallan(
  customerId: string,
  items: ChallanItemInput[],
  status: "DRAFT" | "CONFIRMED",
  createdById?: string
) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new NotFoundError("Customer not found");

  if (items.length === 0) {
    throw new AppError("Challan must include at least one product", 422);
  }

  // Merge duplicate productId entries so we check/deduct stock correctly.
  const mergedItems = mergeItemsByProduct(items);

  return prisma.$transaction(async (tx) => {
    const productIds = mergedItems.map((i) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      throw new NotFoundError(`Product(s) not found: ${missing.join(", ")}`);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    if (status === "CONFIRMED") {
      // Check stock sufficiency for every item BEFORE deducting anything.
      for (const item of mergedItems) {
        const product = productMap.get(item.productId)!;
        if (product.currentStock < item.quantity) {
          throw new ConflictError(
            `Insufficient stock for "${product.name}". Available: ${product.currentStock}, requested: ${item.quantity}`,
            { productId: product.id, available: product.currentStock, requested: item.quantity }
          );
        }
      }
    }

    const challanNumber = await generateChallanNumberInTx(tx);
    const totalQuantity = mergedItems.reduce((sum, i) => sum + i.quantity, 0);

    const challan = await tx.challan.create({
      data: {
        challanNumber,
        customerId,
        status,
        totalQuantity,
        createdById,
        confirmedAt: status === "CONFIRMED" ? new Date() : null,
        items: {
          create: mergedItems.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: product.id,
              quantity: item.quantity,
              productNameSnapshot: product.name,
              productSkuSnapshot: product.sku,
              unitPriceSnapshot: product.unitPrice,
            };
          }),
        },
      },
      include: { items: true, customer: true },
    });

    if (status === "CONFIRMED") {
      // Deduct stock + write a stock movement log entry per item.
      for (const item of mergedItems) {
        const product = productMap.get(item.productId)!;
        await tx.product.update({
          where: { id: product.id },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantity: item.quantity,
            movementType: "OUT",
            reason: `Sales challan ${challanNumber}`,
            createdById,
          },
        });
      }
    }

    return challan;
  });
}

/**
 * Confirms an existing DRAFT challan: re-checks stock at confirmation time
 * (stock may have changed since the draft was created), deducts stock, and
 * writes stock movement logs. Refuses if the challan isn't currently DRAFT.
 */
export async function confirmChallan(challanId: string, confirmedById?: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({
      where: { id: challanId },
      include: { items: true },
    });
    if (!challan) throw new NotFoundError("Challan not found");
    if (challan.status !== "DRAFT") {
      throw new ConflictError(`Only DRAFT challans can be confirmed. Current status: ${challan.status}`);
    }

    const productIds = challan.items.map((i) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of challan.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundError(`Product ${item.productId} no longer exists`);
      if (product.currentStock < item.quantity) {
        throw new ConflictError(
          `Insufficient stock for "${product.name}". Available: ${product.currentStock}, requested: ${item.quantity}`,
          { productId: product.id, available: product.currentStock, requested: item.quantity }
        );
      }
    }

    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: "OUT",
          reason: `Sales challan ${challan.challanNumber} confirmed`,
          createdById: confirmedById,
        },
      });
    }

    return tx.challan.update({
      where: { id: challanId },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
      include: { items: true, customer: true },
    });
  });
}

/**
 * Cancels a challan. If it was CONFIRMED, stock is restored (reversal),
 * with matching IN stock movement log entries for audit trail.
 */
export async function cancelChallan(challanId: string, cancelledById?: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({
      where: { id: challanId },
      include: { items: true },
    });
    if (!challan) throw new NotFoundError("Challan not found");
    if (challan.status === "CANCELLED") {
      throw new ConflictError("Challan is already cancelled");
    }

    if (challan.status === "CONFIRMED") {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: "IN",
            reason: `Sales challan ${challan.challanNumber} cancelled - stock restored`,
            createdById: cancelledById,
          },
        });
      }
    }

    return tx.challan.update({
      where: { id: challanId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      include: { items: true, customer: true },
    });
  });
}

function mergeItemsByProduct(items: ChallanItemInput[]): ChallanItemInput[] {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.productId, (map.get(item.productId) || 0) + item.quantity);
  }
  return Array.from(map.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

// Same numbering logic as utils/challanNumber.ts but usable inside an active
// transaction client.
async function generateChallanNumberInTx(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${year + 1}-01-01T00:00:00.000Z`);
  const countThisYear = await tx.challan.count({
    where: { createdAt: { gte: startOfYear, lt: endOfYear } },
  });
  const sequence = String(countThisYear + 1).padStart(6, "0");
  return `CH-${year}-${sequence}`;
}

export { generateChallanNumber };
