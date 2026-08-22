import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.routes";
import clubsRouter from "./routes/clubs.routes";
import contractsRouter from "./routes/contracts.routes";
import dashboardRouter from "./routes/dashboard.routes";
import favoritesRouter from "./routes/favorites.routes";
import healthRouter from "./routes/health.routes";
import { localizeApiResponse } from "./middleware/i18n.middleware";
import playersRouter from "./routes/players.routes";
import publicRouter from "./routes/public.routes";
import sportsRouter from "./routes/sports.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(
  cors({
    origin: true
  })
);
app.use(express.json());
app.use(localizeApiResponse);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      message: "Backend API is running"
    }
  });
});

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/clubs", clubsRouter);
app.use("/api/sports", sportsRouter);
app.use("/api/players", playersRouter);
app.use("/api/contracts", contractsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/public", publicRouter);
app.use("/api/favorites", favoritesRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
