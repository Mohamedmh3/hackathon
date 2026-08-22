import { Router } from "express";
import { successResponse } from "../utils/apiResponse";

const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json(
    successResponse({
      service: "backend",
      status: "ok"
    })
  );
});

export default healthRouter;
