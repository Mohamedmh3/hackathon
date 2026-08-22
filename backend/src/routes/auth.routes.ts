import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";
import { successResponse } from "../utils/apiResponse";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);

authRouter.get("/admin-check", requireAuth, requireRoles("admin"), (_req, res) => {
  res.status(200).json(successResponse({ allowed: true }));
});

export default authRouter;
