import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";

describe("i18n responses", () => {
  it("returns Arabic success message when Accept-Language is ar", async () => {
    const response = await request(app).get("/").set("Accept-Language", "ar");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.message).toBe("واجهة برمجة التطبيقات تعمل");
  });

  it("returns Arabic auth error when Accept-Language is ar", async () => {
    const response = await request(app).get("/api/auth/me").set("Accept-Language", "ar");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("رأس Authorization مفقود");
  });
});
