import { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPlayerAchievements,
  patchPlayerAchievement,
  postPlayerAchievement,
  postPlayerDocument,
  removePlayerAchievement,
  removePlayerDocument
} from "../src/controllers/player-assets.controller";

const listPlayerAchievementsMock = vi.fn();
const createAchievementMock = vi.fn();
const updateAchievementMock = vi.fn();
const deleteAchievementMock = vi.fn();
const createPlayerDocumentMock = vi.fn();
const deletePlayerDocumentMock = vi.fn();
const getPlayerByIdMock = vi.fn();

vi.mock("../src/services/achievements.service", () => ({
  listPlayerAchievements: (...args: unknown[]) => listPlayerAchievementsMock(...args),
  createAchievement: (...args: unknown[]) => createAchievementMock(...args),
  updateAchievement: (...args: unknown[]) => updateAchievementMock(...args),
  deleteAchievement: (...args: unknown[]) => deleteAchievementMock(...args)
}));

vi.mock("../src/services/documents.service", () => ({
  listPlayerDocuments: vi.fn(),
  createPlayerDocument: (...args: unknown[]) => createPlayerDocumentMock(...args),
  deletePlayerDocument: (...args: unknown[]) => deletePlayerDocumentMock(...args)
}));

vi.mock("../src/services/players.service", () => ({
  getPlayerById: (...args: unknown[]) => getPlayerByIdMock(...args)
}));

const createResponse = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("player assets controller", () => {
  beforeEach(() => {
    listPlayerAchievementsMock.mockReset();
    createAchievementMock.mockReset();
    updateAchievementMock.mockReset();
    deleteAchievementMock.mockReset();
    createPlayerDocumentMock.mockReset();
    deletePlayerDocumentMock.mockReset();
    getPlayerByIdMock.mockReset();
  });

  it("forbids player from uploading sensitive documents", async () => {
    const req = {
      params: { playerId: "123e4567-e89b-42d3-a456-556642440111" },
      body: { docType: "passport", fileUrl: "https://storage.example/doc.pdf" },
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

    await postPlayerDocument(req, res, next);

    expect(createPlayerDocumentMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("allows player to create own achievement", async () => {
    createAchievementMock.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-556642440901",
      player_id: "123e4567-e89b-42d3-a456-556642440111",
      title: "National Cup",
      event_date: "2026-05-01"
    });

    const req = {
      params: { playerId: "123e4567-e89b-42d3-a456-556642440111" },
      body: {
        title: "National Cup",
        eventDate: "2026-05-01",
        place: "Baghdad",
        rank: "1",
        imageUrl: "https://storage.example/achievements/cup.png"
      },
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

    await postPlayerAchievement(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(createAchievementMock).toHaveBeenCalledWith({
      playerId: "123e4567-e89b-42d3-a456-556642440111",
      title: "National Cup",
      eventDate: "2026-05-01",
      place: "Baghdad",
      rank: "1",
      imageUrl: "https://storage.example/achievements/cup.png"
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("forbids club staff from listing achievements for another club player", async () => {
    getPlayerByIdMock.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-556642440111",
      current_club_id: "123e4567-e89b-42d3-a456-556642440222"
    });

    const req = {
      params: { playerId: "123e4567-e89b-42d3-a456-556642440111" },
      user: {
        id: "u-staff",
        email: "staff@example.com",
        role: "club_staff",
        clubId: "123e4567-e89b-42d3-a456-556642440333",
        playerId: null
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getPlayerAchievements(req, res, next);

    expect(listPlayerAchievementsMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("scopes achievement update to playerId and achievementId", async () => {
    updateAchievementMock.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-556642440901",
      player_id: "123e4567-e89b-42d3-a456-556642440111",
      title: "Updated Title"
    });

    const req = {
      params: {
        playerId: "123e4567-e89b-42d3-a456-556642440111",
        achievementId: "123e4567-e89b-42d3-a456-556642440901"
      },
      body: { title: "Updated Title" },
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

    await patchPlayerAchievement(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(updateAchievementMock).toHaveBeenCalledWith(
      "123e4567-e89b-42d3-a456-556642440111",
      "123e4567-e89b-42d3-a456-556642440901",
      expect.objectContaining({ title: "Updated Title" })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("scopes document delete to playerId", async () => {
    const req = {
      params: {
        playerId: "123e4567-e89b-42d3-a456-556642440111",
        documentId: "123e4567-e89b-42d3-a456-556642440777"
      },
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

    await removePlayerDocument(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(deletePlayerDocumentMock).toHaveBeenCalledWith(
      "123e4567-e89b-42d3-a456-556642440777",
      "123e4567-e89b-42d3-a456-556642440111"
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("scopes achievement delete to playerId", async () => {
    const req = {
      params: {
        playerId: "123e4567-e89b-42d3-a456-556642440111",
        achievementId: "123e4567-e89b-42d3-a456-556642440901"
      },
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

    await removePlayerAchievement(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(deleteAchievementMock).toHaveBeenCalledWith(
      "123e4567-e89b-42d3-a456-556642440111",
      "123e4567-e89b-42d3-a456-556642440901"
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
