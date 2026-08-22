import { Router } from "express";
import {
  getMyPlayerProfile,
  getPlayerProfileById,
  getPlayers,
  patchPlayer,
  patchPlayerStatus,
  postPlayer
} from "../controllers/players.controller";
import {
  getPlayerAchievements,
  getPlayerDocuments,
  patchPlayerAchievement,
  postPlayerAchievement,
  postPlayerDocument,
  removePlayerAchievement,
  removePlayerDocument
} from "../controllers/player-assets.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const playersRouter = Router();

playersRouter.get("/", requireAuth, requireRoles("admin", "club_staff"), getPlayers);
playersRouter.post("/", requireAuth, requireRoles("admin", "club_staff"), postPlayer);
playersRouter.patch("/:id", requireAuth, requireRoles("admin", "club_staff"), patchPlayer);
playersRouter.patch("/:id/status", requireAuth, requireRoles("admin", "club_staff"), patchPlayerStatus);
playersRouter.get("/me/profile", requireAuth, requireRoles("player"), getMyPlayerProfile);
playersRouter.get("/:id/profile", requireAuth, requireRoles("admin", "club_staff", "player"), getPlayerProfileById);
playersRouter.get("/:playerId/documents", requireAuth, requireRoles("admin", "club_staff"), getPlayerDocuments);
playersRouter.post("/:playerId/documents", requireAuth, requireRoles("admin", "club_staff"), postPlayerDocument);
playersRouter.delete(
  "/:playerId/documents/:documentId",
  requireAuth,
  requireRoles("admin", "club_staff"),
  removePlayerDocument
);
playersRouter.get(
  "/:playerId/achievements",
  requireAuth,
  requireRoles("admin", "club_staff", "player"),
  getPlayerAchievements
);
playersRouter.post(
  "/:playerId/achievements",
  requireAuth,
  requireRoles("admin", "club_staff", "player"),
  postPlayerAchievement
);
playersRouter.patch(
  "/:playerId/achievements/:achievementId",
  requireAuth,
  requireRoles("admin", "club_staff", "player"),
  patchPlayerAchievement
);
playersRouter.delete(
  "/:playerId/achievements/:achievementId",
  requireAuth,
  requireRoles("admin", "club_staff", "player"),
  removePlayerAchievement
);

export default playersRouter;
