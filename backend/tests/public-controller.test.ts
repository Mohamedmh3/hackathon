import { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicClubs, getPublicPlayers } from "../src/controllers/public.controller";

const listPublicPlayersMock = vi.fn();
const listPublicClubsMock = vi.fn();

vi.mock("../src/services/public.service", () => ({
  listPublicPlayers: (...args: unknown[]) => listPublicPlayersMock(...args),
  listPublicClubs: (...args: unknown[]) => listPublicClubsMock(...args)
}));

const createResponse = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("public controller", () => {
  beforeEach(() => {
    listPublicPlayersMock.mockReset();
    listPublicClubsMock.mockReset();
  });

  it("passes filters to public players search", async () => {
    listPublicPlayersMock.mockResolvedValue([]);
    const req = {
      query: {
        search: "ali",
        gender: "male",
        minAge: "18",
        maxAge: "35"
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getPublicPlayers(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(listPublicPlayersMock).toHaveBeenCalledWith(
      expect.objectContaining({ search: "ali", gender: "male", minAge: 18, maxAge: 35 })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("fails when minAge is greater than maxAge", async () => {
    const req = {
      query: {
        minAge: "40",
        maxAge: "20"
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getPublicPlayers(req, res, next);

    expect(listPublicPlayersMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns public clubs list", async () => {
    listPublicClubsMock.mockResolvedValue([]);
    const req = {
      query: {
        city: "baghdad"
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getPublicClubs(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(listPublicClubsMock).toHaveBeenCalledWith({ search: undefined, city: "baghdad", status: undefined });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
