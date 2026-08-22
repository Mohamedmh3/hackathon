import { Router } from "express";
import {
  getClubs,
  getClubStatsById,
  patchClub,
  patchClubStatus,
  postClub
} from "../controllers/clubs.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const clubsRouter = Router();

clubsRouter.get("/", requireAuth, getClubs);
clubsRouter.post("/", requireAuth, requireRoles("admin"), postClub);
clubsRouter.patch("/:id", requireAuth, requireRoles("admin"), patchClub);
clubsRouter.patch("/:id/status", requireAuth, requireRoles("admin"), patchClubStatus);
clubsRouter.get("/:id/stats", requireAuth, requireRoles("admin", "club_staff"), getClubStatsById);

export default clubsRouter;
