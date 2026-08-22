import { Router } from "express";
import {
  getDashboardExpiringContracts,
  getDashboardOverviewStats,
  getDashboardPlayersByClub,
  getDashboardPlayersBySport,
  getDashboardPlayersByStatus
} from "../controllers/dashboard.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const dashboardRouter = Router();

dashboardRouter.get("/overview", requireAuth, requireRoles("admin", "club_staff"), getDashboardOverviewStats);
dashboardRouter.get(
  "/players-by-status",
  requireAuth,
  requireRoles("admin", "club_staff"),
  getDashboardPlayersByStatus
);
dashboardRouter.get(
  "/players-by-sport",
  requireAuth,
  requireRoles("admin", "club_staff"),
  getDashboardPlayersBySport
);
dashboardRouter.get(
  "/players-by-club",
  requireAuth,
  requireRoles("admin", "club_staff"),
  getDashboardPlayersByClub
);
dashboardRouter.get(
  "/contracts-expiring",
  requireAuth,
  requireRoles("admin", "club_staff"),
  getDashboardExpiringContracts
);

export default dashboardRouter;
