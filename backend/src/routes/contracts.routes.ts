import { Router } from "express";
import {
  getContracts,
  getExpiringContracts,
  getMyActiveContract,
  patchCloseContract,
  patchContract,
  postTransferContract,
  postContract
} from "../controllers/contracts.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const contractsRouter = Router();

contractsRouter.get("/", requireAuth, requireRoles("admin", "club_staff"), getContracts);
contractsRouter.post("/", requireAuth, requireRoles("admin", "club_staff"), postContract);
contractsRouter.post("/transfer", requireAuth, requireRoles("admin", "club_staff"), postTransferContract);
contractsRouter.patch("/:id", requireAuth, requireRoles("admin", "club_staff"), patchContract);
contractsRouter.patch("/:id/close", requireAuth, requireRoles("admin", "club_staff"), patchCloseContract);
contractsRouter.get(
  "/expiring/soon",
  requireAuth,
  requireRoles("admin", "club_staff"),
  getExpiringContracts
);
contractsRouter.get("/me/active", requireAuth, requireRoles("player"), getMyActiveContract);

export default contractsRouter;
