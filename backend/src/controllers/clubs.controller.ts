import { NextFunction, Request, Response } from "express";
import { createClub, getClubStats, listClubs, updateClub, updateClubStatus } from "../services/clubs.service";
import { ClubStatus } from "../types/club";
import { successResponse } from "../utils/apiResponse";
import { HttpError } from "../utils/httpError";
import { parseOptionalText, parseRequiredText, parseUuid } from "../utils/validation";

const parseClubStatus = (value: unknown): ClubStatus => {
  if (value !== "active" && value !== "inactive") {
    throw new HttpError(400, "status must be either active or inactive");
  }
  return value;
};

export const getClubs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = parseOptionalText(req.query.search, "search", 120) ?? undefined;
    const statusQuery = req.query.status;
    const status = statusQuery === undefined ? undefined : parseClubStatus(statusQuery);

    const clubs = await listClubs({
      search,
      status
    });

    res.status(200).json(successResponse(clubs));
  } catch (error) {
    next(error);
  }
};

export const postClub = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const name = parseRequiredText(req.body?.name, "name");
    const city = parseRequiredText(req.body?.city, "city");
    const logoUrl = parseOptionalText(req.body?.logoUrl, "logoUrl", 500);

    const club = await createClub({ name, city, logoUrl });
    res.status(201).json(successResponse(club));
  } catch (error) {
    next(error);
  }
};

export const patchClub = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clubId = parseUuid(req.params.id, "id");

    const name = req.body?.name === undefined ? undefined : parseRequiredText(req.body.name, "name");
    const city = req.body?.city === undefined ? undefined : parseRequiredText(req.body.city, "city");
    const logoUrl =
      req.body?.logoUrl === undefined ? undefined : parseOptionalText(req.body.logoUrl, "logoUrl", 500);

    if (name === undefined && city === undefined && logoUrl === undefined) {
      throw new HttpError(400, "At least one field is required: name, city, logoUrl");
    }

    const club = await updateClub(clubId, { name, city, logoUrl });
    res.status(200).json(successResponse(club));
  } catch (error) {
    next(error);
  }
};

export const patchClubStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clubId = parseUuid(req.params.id, "id");
    const status = parseClubStatus(req.body?.status);

    const club = await updateClubStatus(clubId, status);
    res.status(200).json(successResponse(club));
  } catch (error) {
    next(error);
  }
};

export const getClubStatsById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const clubId = parseUuid(req.params.id, "id");
    if (req.user.role === "club_staff" && req.user.clubId !== clubId) {
      throw new HttpError(403, "Forbidden");
    }

    const stats = await getClubStats(clubId);
    res.status(200).json(successResponse(stats));
  } catch (error) {
    next(error);
  }
};
