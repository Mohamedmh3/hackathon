import { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDashboardOverviewStats,
  getDashboardPlayersByClub
} from "../src/controllers/dashboard.controller";

const getDashboardOverviewMock = vi.fn();
const getPlayersByClubStatsMock = vi.fn();

vi.mock("../src/services/dashboard.service", () => ({
  getDashboardOverview: (...args: unknown[]) => getDashboardOverviewMock(...args),
  getPlayersByStatusStats: vi.fn(),
  getPlayersBySportStats: vi.fn(),
  getPlayersByClubStats: (...args: unknown[]) => getPlayersByClubStatsMock(...args),
  getExpiringContractsStats: vi.fn()
}));

const createResponse = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("dashboard controller", () => {
  beforeEach(() => {
    getDashboardOverviewMock.mockReset();
    getPlayersByClubStatsMock.mockReset();
  });

  it("scopes overview stats for club staff", async () => {
    getDashboardOverviewMock.mockResolvedValue({
      totalPlayers: 5,
      totalClubs: 1,
      activeContracts: 4,
      contractsExpiringSoon: 1
    });

    const req = {
      query: {},
      user: {
        id: "u-staff",
        email: "staff@example.com",
        role: "club_staff",
        clubId: "123e4567-e89b-42d3-a456-556642440001",
        playerId: null
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getDashboardOverviewStats(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(getDashboardOverviewMock).toHaveBeenCalledWith("123e4567-e89b-42d3-a456-556642440001", 30);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("uses global scope for admin overview stats", async () => {
    getDashboardOverviewMock.mockResolvedValue({
      totalPlayers: 50,
      totalClubs: 8,
      activeContracts: 36,
      contractsExpiringSoon: 6
    });

    const req = {
      query: { days: "45" },
      user: {
        id: "u-admin",
        email: "admin@example.com",
        role: "admin",
        clubId: null,
        playerId: null
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getDashboardOverviewStats(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(getDashboardOverviewMock).toHaveBeenCalledWith(undefined, 45);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("blocks club staff without club assignment", async () => {
    const req = {
      query: {},
      user: {
        id: "u-staff",
        email: "staff@example.com",
        role: "club_staff",
        clubId: null,
        playerId: null
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getDashboardPlayersByClub(req, res, next);

    expect(getPlayersByClubStatsMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
