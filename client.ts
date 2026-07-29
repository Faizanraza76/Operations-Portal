import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import {
  createChallanSchema,
  updateChallanSchema,
  idParamSchema,
  listChallanQuerySchema,
} from "../schemas/challan.schema";
import {
  createChallan,
  listChallans,
  getChallan,
  updateChallan,
  confirmChallan,
  cancelChallan,
} from "../controllers/challan.controller";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listChallanQuerySchema), asyncHandler(listChallans));
router.get("/:id", validate(idParamSchema), asyncHandler(getChallan));

// Sales creates/edits/confirms challans; Admin can do everything; Accounts/Warehouse read-only.
router.post(
  "/",
  requireRole("ADMIN", "SALES"),
  validate(createChallanSchema),
  asyncHandler(createChallan)
);

router.put(
  "/:id",
  requireRole("ADMIN", "SALES"),
  validate(updateChallanSchema),
  asyncHandler(updateChallan)
);

router.post(
  "/:id/confirm",
  requireRole("ADMIN", "SALES"),
  validate(idParamSchema),
  asyncHandler(confirmChallan)
);

router.post(
  "/:id/cancel",
  requireRole("ADMIN", "SALES"),
  validate(idParamSchema),
  asyncHandler(cancelChallan)
);

export default router;
