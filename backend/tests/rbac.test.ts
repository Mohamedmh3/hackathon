import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { requireRoles } from "../src/middleware/auth.middleware";

const buildAppWithRole = (role?: "admin" | "club_staff" | "player" | "public") => {
  const app = express();

  app.get(
    "/secure",
    (req, _res, next) => {
      if (role) {
        req.user = {
          id: "u-1",
          email: "user@example.com",
          role,
          clubId: null,
          playerId: null
        };
      }
      next();
    },
    requireRoles("admin"),
    (_req, res) => {
      res.status(200).json({ success: true, data: { allowed: true } });
    }
  );

  return app;
};

describe("Role middleware", () => {
  it("blocks unauthenticated requests", async () => {
    const app = buildAppWithRole();
    const response = await request(app).get("/secure");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("blocks users without required role", async () => {
    const app = buildAppWithRole("club_staff");
    const response = await request(app).get("/secure");

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("allows users with required role", async () => {
    const app = buildAppWithRole("admin");
    const response = await request(app).get("/secure");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
