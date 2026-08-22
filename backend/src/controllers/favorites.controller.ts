import { NextFunction, Request, Response } from "express";
import { createFavorite, deleteFavorite, listFavorites } from "../services/favorites.service";
import { successResponse } from "../utils/apiResponse";
import { HttpError } from "../utils/httpError";
import { parseUuid } from "../utils/validation";

export const getMyFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const favorites = await listFavorites(req.user.id);
    res.status(200).json(successResponse(favorites));
  } catch (error) {
    next(error);
  }
};

export const postMyFavorite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const hasPlayerId = req.body?.playerId !== undefined && req.body?.playerId !== null;
    const hasClubId = req.body?.clubId !== undefined && req.body?.clubId !== null;

    if (hasPlayerId === hasClubId) {
      throw new HttpError(400, "Exactly one of playerId or clubId is required");
    }

    const playerId = hasPlayerId ? parseUuid(req.body.playerId, "playerId") : null;
    const clubId = hasClubId ? parseUuid(req.body.clubId, "clubId") : null;

    const favorite = await createFavorite({
      userId: req.user.id,
      playerId,
      clubId
    });

    res.status(201).json(successResponse(favorite));
  } catch (error) {
    next(error);
  }
};

export const removeMyFavorite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const favoriteId = parseUuid(req.params.favoriteId, "favoriteId");
    await deleteFavorite(req.user.id, favoriteId);
    res.status(200).json(successResponse({ deleted: true }));
  } catch (error) {
    next(error);
  }
};
