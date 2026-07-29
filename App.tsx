import { Router } from "express";
import { login, me } from "../controllers/auth.controller";
import { loginSchema } from "../schemas/auth.schema";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.post("/login", validate(loginSchema), asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));

export default router;
