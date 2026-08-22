import { NextFunction, Request, Response } from "express";
import {
  changePlayerStatus,
  createPlayer,
  getPlayerById,
  getPlayerProfile,
  listPlayers,
  updatePlayer
} from "../services/players.service";
import { PlayerGender, PlayerStatus } from "../types/player";
import { successResponse } from "../utils/apiResponse";
import { HttpError } from "../utils/httpError";
import {
  parseOptionalDate,
  parseOptionalText,
  parseRequiredDate,
  parseRequiredText,
  parseUuid
} from "../utils/validation";

const parsePlayerStatus = (value: unknown, fieldName = "status"): PlayerStatus => {
  if (value === "active" || value === "retired" || value === "free" || value === "deceased") {
    return value;
  }
  throw new HttpError(400, `${fieldName} must be one of: active, retired, free, deceased`);
};

const parsePlayerGender = (value: unknown): PlayerGender => {
  if (value === "male" || value === "female") {
    return value;
  }
  throw new HttpError(400, "gender must be either male or female");
};

const ensureStatusDeathDateCompatibility = (status: PlayerStatus, deathDate: string | null): void => {
  if (status === "deceased" && !deathDate) {
    throw new HttpError(400, "deathDate is required when status is deceased");
  }
  if (status !== "deceased" && deathDate) {
    throw new HttpError(400, "deathDate is only allowed when status is deceased");
  }
};

const ensureStaffCanAccessPlayer = async (req: Request, playerId: string): Promise<void> => {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  if (req.user.role !== "club_staff") {
    return;
  }

  const player = await getPlayerById(playerId);
  if (!req.user.clubId || player.current_club_id !== req.user.clubId) {
    throw new HttpError(403, "Forbidden");
  }
};

export const getPlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const search = parseOptionalText(req.query.search, "search", 120) ?? undefined;
    const sportId = req.query.sportId === undefined ? undefined : parseUuid(req.query.sportId, "sportId");
    const status =
      req.query.status === undefined ? undefined : parsePlayerStatus(req.query.status, "status");
    const gender = req.query.gender === undefined ? undefined : parsePlayerGender(req.query.gender);

    let clubId = req.query.clubId === undefined ? undefined : parseUuid(req.query.clubId, "clubId");
    if (req.user.role === "club_staff") {
      if (!req.user.clubId) {
        throw new HttpError(403, "Forbidden");
      }
      clubId = req.user.clubId;
    }

    const players = await listPlayers({
      search,
      sportId,
      clubId,
      status,
      gender
    });

    res.status(200).json(successResponse(players));
  } catch (error) {
    next(error);
  }
};

export const postPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const playerCode = parseRequiredText(req.body?.playerCode, "playerCode", 4, 40);
    const fullName = parseRequiredText(req.body?.fullName, "fullName", 2, 120);
    const sportId = parseUuid(req.body?.sportId, "sportId");
    const birthDate = parseRequiredDate(req.body?.birthDate, "birthDate");
    const nationality = parseRequiredText(req.body?.nationality, "nationality", 2, 80);
    const gender = parsePlayerGender(req.body?.gender);
    const status = req.body?.status === undefined ? "active" : parsePlayerStatus(req.body.status);
    const deathDate = parseOptionalDate(req.body?.deathDate, "deathDate");
    const photoUrl = parseOptionalText(req.body?.photoUrl, "photoUrl", 500);
    const enrollmentDate = parseOptionalDate(req.body?.enrollmentDate, "enrollmentDate");

    ensureStatusDeathDateCompatibility(status, deathDate);

    let currentClubId: string | null = req.body?.currentClubId
      ? parseUuid(req.body.currentClubId, "currentClubId")
      : null;

    if (req.user.role === "club_staff") {
      if (!req.user.clubId) {
        throw new HttpError(403, "Forbidden");
      }
      if (currentClubId && currentClubId !== req.user.clubId) {
        throw new HttpError(403, "club_staff can only create players for their own club");
      }
      currentClubId = req.user.clubId;
    }

    const player = await createPlayer({
      playerCode,
      fullName,
      sportId,
      currentClubId,
      enrollmentDate,
      birthDate,
      nationality,
      gender,
      status,
      deathDate,
      photoUrl
    });

    res.status(201).json(successResponse(player));
  } catch (error) {
    next(error);
  }
};

export const patchPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const playerId = parseUuid(req.params.id, "id");
    await ensureStaffCanAccessPlayer(req, playerId);

    const fullName = req.body?.fullName === undefined ? undefined : parseRequiredText(req.body.fullName, "fullName");
    const sportId = req.body?.sportId === undefined ? undefined : parseUuid(req.body.sportId, "sportId");
    const birthDate = req.body?.birthDate === undefined ? undefined : parseRequiredDate(req.body.birthDate, "birthDate");
    const nationality =
      req.body?.nationality === undefined ? undefined : parseRequiredText(req.body.nationality, "nationality", 2, 80);
    const gender = req.body?.gender === undefined ? undefined : parsePlayerGender(req.body.gender);
    const deathDate = req.body?.deathDate === undefined ? undefined : parseOptionalDate(req.body.deathDate, "deathDate");
    const photoUrl = req.body?.photoUrl === undefined ? undefined : parseOptionalText(req.body.photoUrl, "photoUrl", 500);
    const enrollmentDate =
      req.body?.enrollmentDate === undefined ? undefined : parseOptionalDate(req.body.enrollmentDate, "enrollmentDate");

    let currentClubId: string | null | undefined;
    if (req.body?.currentClubId !== undefined) {
      currentClubId = req.body.currentClubId === null ? null : parseUuid(req.body.currentClubId, "currentClubId");
    }

    if (req.user?.role === "club_staff") {
      if (!req.user.clubId) {
        throw new HttpError(403, "Forbidden");
      }
      if (currentClubId !== undefined && currentClubId !== req.user.clubId) {
        throw new HttpError(403, "club_staff can only set currentClubId to their own club");
      }
      if (currentClubId === undefined) {
        currentClubId = req.user.clubId;
      }
    }

    if (
      fullName === undefined &&
      sportId === undefined &&
      currentClubId === undefined &&
      enrollmentDate === undefined &&
      birthDate === undefined &&
      nationality === undefined &&
      gender === undefined &&
      deathDate === undefined &&
      photoUrl === undefined
    ) {
      throw new HttpError(
        400,
        "At least one field is required: fullName, sportId, currentClubId, enrollmentDate, birthDate, nationality, gender, deathDate, photoUrl"
      );
    }

    const player = await updatePlayer(playerId, {
      fullName,
      sportId,
      currentClubId,
      enrollmentDate,
      birthDate,
      nationality,
      gender,
      deathDate,
      photoUrl
    });

    res.status(200).json(successResponse(player));
  } catch (error) {
    next(error);
  }
};

export const patchPlayerStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const playerId = parseUuid(req.params.id, "id");
    await ensureStaffCanAccessPlayer(req, playerId);

    const newStatus = parsePlayerStatus(req.body?.status, "status");
    const reason = parseRequiredText(req.body?.reason, "reason", 3, 300);
    const deathDate = parseOptionalDate(req.body?.deathDate, "deathDate");

    ensureStatusDeathDateCompatibility(newStatus, deathDate);

    const result = await changePlayerStatus(playerId, {
      newStatus,
      reason,
      changedBy: req.user.id,
      deathDate
    });

    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getPlayerProfileById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const playerId = parseUuid(req.params.id, "id");

    if (req.user.role === "player") {
      if (!req.user.playerId || req.user.playerId !== playerId) {
        throw new HttpError(403, "Forbidden");
      }
    }

    await ensureStaffCanAccessPlayer(req, playerId);
    const profile = await getPlayerProfile(playerId);
    res.status(200).json(successResponse(profile));
  } catch (error) {
    next(error);
  }
};

export const getMyPlayerProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== "player" || !req.user.playerId) {
      throw new HttpError(403, "Forbidden");
    }

    const profile = await getPlayerProfile(req.user.playerId);
    res.status(200).json(successResponse(profile));
  } catch (error) {
    next(error);
  }
};
