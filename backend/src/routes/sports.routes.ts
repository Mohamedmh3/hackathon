import { Router } from "express";
import { getSports, patchSport, postSport, removeSport } from "../controllers/sports.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const sportsRouter = Router();

sportsRouter.get("/", requireAuth, getSports);
sportsRouter.post("/", requireAuth, requireRoles("admin"), postSport);
sportsRouter.patch("/:id", requireAuth, requireRoles("admin"), patchSport);
sportsRouter.delete("/:id", requireAuth, requireRoles("admin"), removeSport);

export default sportsRouter;
