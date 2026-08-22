import { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getMyPlayerProfile,
  getPlayerProfileById,
  getPlayers,
  postPlayer
} from "../src/controllers/players.controller";

const listPlayersMock = vi.fn();
const getPlayerByIdMock = vi.fn();
const createPlayerMock = vi.fn();
const getPlayerProfileMock = vi.fn();

vi.mock("../src/services/players.service", () => ({
  listPlayers: (...args: unknown[]) => listPlayersMock(...args),
  getPlayerById: (...args: unknown[]) => getPlayerByIdMock(...args),
  createPlayer: (...args: unknown[]) => createPlayerMock(...args),
  updatePlayer: vi.fn(),
  changePlayerStatus: vi.fn(),
  getPlayerProfile: (...args: unknown[]) => getPlayerProfileMock(...args)
}));

const createResponse = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("players controller", () => {
  beforeEach(() => {
    listPlayersMock.mockReset();
    getPlayerByIdMock.mockReset();
    createPlayerMock.mockReset();
    getPlayerProfileMock.mockReset();
  });

  it("forces club staff listing to their own club", async () => {
    listPlayersMock.mockResolvedValue([]);
    const req = {
      query: {
        clubId: "123e4567-e89b-42d3-a456-556642440000"
      },
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

    await getPlayers(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(listPlayersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clubId: "123e4567-e89b-42d3-a456-556642440001"
      })
    );
  });

  it("blocks club staff from creating player in another club", async () => {
    const req = {
      body: {
        playerCode: "ACA-2026-001",
        fullName: "Player One",
        sportId: "123e4567-e89b-42d3-a456-556642440010",
        currentClubId: "123e4567-e89b-42d3-a456-556642440000",
        birthDate: "2001-01-01",
        nationality: "Iraqi",
        gender: "male"
      },
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

    await postPlayer(req, res, next);

    expect(createPlayerMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("blocks player from viewing another player's profile", async () => {
    const req = {
      params: { id: "123e4567-e89b-42d3-a456-556642440999" },
      user: {
        id: "u-player",
        email: "player@example.com",
        role: "player",
        clubId: null,
        playerId: "123e4567-e89b-42d3-a456-556642440111"
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getPlayerProfileById(req, res, next);

    expect(getPlayerProfileMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns own profile for player role", async () => {
    getPlayerProfileMock.mockResolvedValue({
      player: { id: "123e4567-e89b-42d3-a456-556642440111" },
      activeContract: null,
      history: [],
      achievements: []
    });

    const req = {
      user: {
        id: "u-player",
        email: "player@example.com",
        role: "player",
        clubId: null,
        playerId: "123e4567-e89b-42d3-a456-556642440111"
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getMyPlayerProfile(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(getPlayerProfileMock).toHaveBeenCalledWith("123e4567-e89b-42d3-a456-556642440111");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
