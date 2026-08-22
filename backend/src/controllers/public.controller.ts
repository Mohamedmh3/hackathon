import { NextFunction, Request, Response } from "express";
import { listPublicClubs, listPublicPlayers } from "../services/public.service";
import { successResponse } from "../utils/apiResponse";
import { HttpError } from "../utils/httpError";
import { parseOptionalText, parsePositiveInt, parseUuid } from "../utils/validation";

const parsePlayerStatus = (value: unknown): "active" | "retired" | "free" | "deceased" => {
  if (value === "active" || value === "retired" || value === "free" || value === "deceased") {
    return value;
  }
  throw new HttpError(400, "status must be one of: active, retired, free, deceased");
};

const parseGender = (value: unknown): "male" | "female" => {
  if (value === "male" || value === "female") {
    return value;
  }
  throw new HttpError(400, "gender must be one of: male, female");
};

const parseClubStatus = (value: unknown): "active" | "inactive" => {
  if (value === "active" || value === "inactive") {
    return value;
  }
  throw new HttpError(400, "status must be one of: active, inactive");
};

export const getPublicPlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = parseOptionalText(req.query.search, "search", 120) ?? undefined;
    const nationality = parseOptionalText(req.query.nationality, "nationality", 80) ?? undefined;
    const gender = req.query.gender === undefined ? undefined : parseGender(req.query.gender);
    const sportId = req.query.sportId === undefined ? undefined : parseUuid(req.query.sportId, "sportId");
    const clubId = req.query.clubId === undefined ? undefined : parseUuid(req.query.clubId, "clubId");
    const status = req.query.status === undefined ? undefined : parsePlayerStatus(req.query.status);

    const minAge = req.query.minAge === undefined ? undefined : parsePositiveInt(req.query.minAge, "minAge", 1, 100);
    const maxAge = req.query.maxAge === undefined ? undefined : parsePositiveInt(req.query.maxAge, "maxAge", 1, 100);
    if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
      throw new HttpError(400, "minAge must be less than or equal to maxAge");
    }

    const players = await listPublicPlayers({
      search,
      nationality,
      gender,
      sportId,
      clubId,
      status,
      minAge,
      maxAge
    });

    res.status(200).json(successResponse(players));
  } catch (error) {
    next(error);
  }
};

export const getPublicClubs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = parseOptionalText(req.query.search, "search", 120) ?? undefined;
    const city = parseOptionalText(req.query.city, "city", 80) ?? undefined;
    const status = req.query.status === undefined ? undefined : parseClubStatus(req.query.status);

    const clubs = await listPublicClubs({
      search,
      city,
      status
    });

    res.status(200).json(successResponse(clubs));
  } catch (error) {
    next(error);
  }
};
