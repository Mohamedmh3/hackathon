import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";

describe("Auth validation", () => {
  it("rejects invalid email during login", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "bad-email",
      password: "password123"
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: "A valid email is required"
    });
  });

  it("rejects short password during register", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "user@example.com",
      password: "12345",
      fullName: "Test User"
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: "Password must be 8-72 characters and include letters and numbers"
    });
  });

  it("rejects login without password complexity", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "user@example.com",
      password: "12345678"
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: "Password must be 8-72 characters and include letters and numbers"
    });
  });
});
