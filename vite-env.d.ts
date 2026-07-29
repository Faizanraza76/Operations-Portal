import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import {
  createCustomerSchema,
  updateCustomerSchema,
  idParamSchema,
  listCustomerQuerySchema,
  addFollowUpSchema,
} from "../schemas/customer.schema";
import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  addFollowUp,
} from "../controllers/customer.controller";

const router = Router();

router.use(requireAuth);

// Admin + Sales manage the CRM; Warehouse/Accounts get read access for context.
router.get("/", validate(listCustomerQuerySchema), asyncHandler(listCustomers));
router.get("/:id", validate(idParamSchema), asyncHandler(getCustomer));

router.post(
  "/",
  requireRole("ADMIN", "SALES"),
  validate(createCustomerSchema),
  asyncHandler(createCustomer)
);

router.put(
  "/:id",
  requireRole("ADMIN", "SALES"),
  validate(updateCustomerSchema),
  asyncHandler(updateCustomer)
);

router.post(
  "/:id/follow-ups",
  requireRole("ADMIN", "SALES"),
  validate(addFollowUpSchema),
  asyncHandler(addFollowUp)
);

export default router;
