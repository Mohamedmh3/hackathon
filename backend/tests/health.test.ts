import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";

describe("Health endpoints", () => {
  it("returns success response for GET /api/health", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        service: "backend",
        status: "ok"
      }
    });
  });

  it("returns error response for unknown routes", async () => {
    const response = await request(app).get("/api/unknown");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(typeof response.body.error).toBe("string");
  });
});
