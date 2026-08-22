import { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMyFavorites, postMyFavorite } from "../src/controllers/favorites.controller";

const listFavoritesMock = vi.fn();
const createFavoriteMock = vi.fn();

vi.mock("../src/services/favorites.service", () => ({
  listFavorites: (...args: unknown[]) => listFavoritesMock(...args),
  createFavorite: (...args: unknown[]) => createFavoriteMock(...args),
  deleteFavorite: vi.fn()
}));

const createResponse = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("favorites controller", () => {
  beforeEach(() => {
    listFavoritesMock.mockReset();
    createFavoriteMock.mockReset();
  });

  it("lists current user favorites", async () => {
    listFavoritesMock.mockResolvedValue([]);
    const req = {
      user: {
        id: "u-public",
        email: "public@example.com",
        role: "public",
        clubId: null,
        playerId: null
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getMyFavorites(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(listFavoritesMock).toHaveBeenCalledWith("u-public");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("requires exactly one target when creating favorite", async () => {
    const req = {
      user: {
        id: "u-public",
        email: "public@example.com",
        role: "public",
        clubId: null,
        playerId: null
      },
      body: {
        playerId: "123e4567-e89b-42d3-a456-556642440111",
        clubId: "123e4567-e89b-42d3-a456-556642440222"
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await postMyFavorite(req, res, next);

    expect(createFavoriteMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("creates player favorite", async () => {
    createFavoriteMock.mockResolvedValue({ id: "fav-1" });
    const req = {
      user: {
        id: "u-public",
        email: "public@example.com",
        role: "public",
        clubId: null,
        playerId: null
      },
      body: {
        playerId: "123e4567-e89b-42d3-a456-556642440111"
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await postMyFavorite(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(createFavoriteMock).toHaveBeenCalledWith({
      userId: "u-public",
      playerId: "123e4567-e89b-42d3-a456-556642440111",
      clubId: null
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
