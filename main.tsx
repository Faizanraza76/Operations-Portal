import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import {
  createProductSchema,
  updateProductSchema,
  idParamSchema,
  listProductQuerySchema,
  stockMovementSchema,
} from "../schemas/product.schema";
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  recordStockMovement,
} from "../controllers/product.controller";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listProductQuerySchema), asyncHandler(listProducts));
router.get("/:id", validate(idParamSchema), asyncHandler(getProduct));

// Warehouse + Admin own inventory data; Sales/Accounts get read-only access above.
router.post(
  "/",
  requireRole("ADMIN", "WAREHOUSE"),
  validate(createProductSchema),
  asyncHandler(createProduct)
);

router.put(
  "/:id",
  requireRole("ADMIN", "WAREHOUSE"),
  validate(updateProductSchema),
  asyncHandler(updateProduct)
);

router.post(
  "/:id/stock-movements",
  requireRole("ADMIN", "WAREHOUSE"),
  validate(stockMovementSchema),
  asyncHandler(recordStockMovement)
);

export default router;
