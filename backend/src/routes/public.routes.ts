import { Router } from "express";
import { getPublicClubs, getPublicPlayers } from "../controllers/public.controller";

const publicRouter = Router();

publicRouter.get("/players", getPublicPlayers);
publicRouter.get("/clubs", getPublicClubs);

export default publicRouter;
