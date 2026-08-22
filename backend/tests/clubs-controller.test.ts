import { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getClubStatsById } from "../src/controllers/clubs.controller";

const getClubStatsMock = vi.fn();

vi.mock("../src/services/clubs.service", () => ({
  getClubStats: (...args: unknown[]) => getClubStatsMock(...args)
}));

const createResponse = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("clubs controller", () => {
  beforeEach(() => {
    getClubStatsMock.mockReset();
  });

  it("forbids club staff from requesting another club stats", async () => {
    const req = {
      params: { id: "123e4567-e89b-42d3-a456-556642440000" },
      user: {
        id: "u-1",
        email: "staff@example.com",
        role: "club_staff",
        clubId: "123e4567-e89b-42d3-a456-556642440001",
        playerId: null
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getClubStatsById(req, res, next);

    expect(getClubStatsMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns stats for allowed role", async () => {
    getClubStatsMock.mockResolvedValue({
      clubId: "123e4567-e89b-42d3-a456-556642440000",
      totalPlayers: 10,
      activeContracts: 8,
      totalContracts: 14
    });

    const req = {
      params: { id: "123e4567-e89b-42d3-a456-556642440000" },
      user: {
        id: "u-1",
        email: "admin@example.com",
        role: "admin",
        clubId: null,
        playerId: null
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getClubStatsById(req, res, next);

    expect(getClubStatsMock).toHaveBeenCalledWith("123e4567-e89b-42d3-a456-556642440000");
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
