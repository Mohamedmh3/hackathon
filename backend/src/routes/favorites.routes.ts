import { Router } from "express";
import { getMyFavorites, postMyFavorite, removeMyFavorite } from "../controllers/favorites.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const favoritesRouter = Router();

favoritesRouter.get("/me", requireAuth, requireRoles("admin", "club_staff", "player", "public"), getMyFavorites);
favoritesRouter.post("/me", requireAuth, requireRoles("admin", "club_staff", "player", "public"), postMyFavorite);
favoritesRouter.delete(
  "/me/:favoriteId",
  requireAuth,
  requireRoles("admin", "club_staff", "player", "public"),
  removeMyFavorite
);

export default favoritesRouter;
