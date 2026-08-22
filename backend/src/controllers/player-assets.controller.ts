import { NextFunction, Request, Response } from "express";
import {
  createAchievement,
  deleteAchievement,
  listPlayerAchievements,
  updateAchievement
} from "../services/achievements.service";
import {
  createPlayerDocument,
  deletePlayerDocument,
  listPlayerDocuments
} from "../services/documents.service";
import { getPlayerById } from "../services/players.service";
import { DocumentType } from "../types/document";
import { successResponse } from "../utils/apiResponse";
import { HttpError } from "../utils/httpError";
import { parseOptionalText, parseRequiredDate, parseRequiredText, parseUuid } from "../utils/validation";

const parseDocumentType = (value: unknown): DocumentType => {
  if (
    value === "id" ||
    value === "passport" ||
    value === "birth_certificate" ||
    value === "contract" ||
    value === "other"
  ) {
    return value;
  }
  throw new HttpError(400, "docType must be one of: id, passport, birth_certificate, contract, other");
};

const ensureCanAccessPlayerData = async (
  req: Request,
  playerId: string,
  includePlayerRole = false
): Promise<void> => {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  if (req.user.role === "admin") {
    return;
  }

  if (req.user.role === "club_staff") {
    const player = await getPlayerById(playerId);
    if (!req.user.clubId || player.current_club_id !== req.user.clubId) {
      throw new HttpError(403, "Forbidden");
    }
    return;
  }

  if (includePlayerRole && req.user.role === "player" && req.user.playerId === playerId) {
    return;
  }

  throw new HttpError(403, "Forbidden");
};

export const getPlayerDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const playerId = parseUuid(req.params.playerId, "playerId");
    await ensureCanAccessPlayerData(req, playerId, false);

    const documents = await listPlayerDocuments(playerId);
    res.status(200).json(successResponse(documents));
  } catch (error) {
    next(error);
  }
};

export const postPlayerDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const playerId = parseUuid(req.params.playerId, "playerId");
    await ensureCanAccessPlayerData(req, playerId, false);

    const docType = parseDocumentType(req.body?.docType);
    const fileUrl = parseRequiredText(req.body?.fileUrl, "fileUrl", 10, 1000);

    const document = await createPlayerDocument({
      playerId,
      docType,
      fileUrl,
      uploadedBy: req.user.id
    });

    res.status(201).json(successResponse(document));
  } catch (error) {
    next(error);
  }
};

export const removePlayerDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const playerId = parseUuid(req.params.playerId, "playerId");
    const documentId = parseUuid(req.params.documentId, "documentId");
    await ensureCanAccessPlayerData(req, playerId, false);

    await deletePlayerDocument(documentId, playerId);
    res.status(200).json(successResponse({ deleted: true }));
  } catch (error) {
    next(error);
  }
};

export const getPlayerAchievements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const playerId = parseUuid(req.params.playerId, "playerId");
    await ensureCanAccessPlayerData(req, playerId, true);

    const achievements = await listPlayerAchievements(playerId);
    res.status(200).json(successResponse(achievements));
  } catch (error) {
    next(error);
  }
};

export const postPlayerAchievement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const playerId = parseUuid(req.params.playerId, "playerId");
    await ensureCanAccessPlayerData(req, playerId, true);

    const title = parseRequiredText(req.body?.title, "title", 2, 200);
    const eventDate = parseRequiredDate(req.body?.eventDate, "eventDate");
    const place = parseOptionalText(req.body?.place, "place", 100);
    const rank = parseOptionalText(req.body?.rank, "rank", 100);
    const imageUrl = parseOptionalText(req.body?.imageUrl, "imageUrl", 1000);

    const achievement = await createAchievement({
      playerId,
      title,
      eventDate,
      place,
      rank,
      imageUrl
    });

    res.status(201).json(successResponse(achievement));
  } catch (error) {
    next(error);
  }
};

export const patchPlayerAchievement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const playerId = parseUuid(req.params.playerId, "playerId");
    const achievementId = parseUuid(req.params.achievementId, "achievementId");
    await ensureCanAccessPlayerData(req, playerId, true);

    const title = req.body?.title === undefined ? undefined : parseRequiredText(req.body.title, "title", 2, 200);
    const eventDate =
      req.body?.eventDate === undefined ? undefined : parseRequiredDate(req.body.eventDate, "eventDate");
    const place = req.body?.place === undefined ? undefined : parseOptionalText(req.body.place, "place", 100);
    const rank = req.body?.rank === undefined ? undefined : parseOptionalText(req.body.rank, "rank", 100);
    const imageUrl =
      req.body?.imageUrl === undefined ? undefined : parseOptionalText(req.body.imageUrl, "imageUrl", 1000);

    if (
      title === undefined &&
      eventDate === undefined &&
      place === undefined &&
      rank === undefined &&
      imageUrl === undefined
    ) {
      throw new HttpError(400, "At least one field is required: title, eventDate, place, rank, imageUrl");
    }

    const achievement = await updateAchievement(playerId, achievementId, {
      title,
      eventDate,
      place,
      rank,
      imageUrl
    });

    res.status(200).json(successResponse(achievement));
  } catch (error) {
    next(error);
  }
};

export const removePlayerAchievement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const playerId = parseUuid(req.params.playerId, "playerId");
    const achievementId = parseUuid(req.params.achievementId, "achievementId");
    await ensureCanAccessPlayerData(req, playerId, true);

    await deleteAchievement(playerId, achievementId);
    res.status(200).json(successResponse({ deleted: true }));
  } catch (error) {
    next(error);
  }
};
