import { NextFunction, Request, Response } from "express";
import {
  getDashboardOverview,
  getExpiringContractsStats,
  getPlayersByClubStats,
  getPlayersBySportStats,
  getPlayersByStatusStats
} from "../services/dashboard.service";
import { successResponse } from "../utils/apiResponse";
import { HttpError } from "../utils/httpError";
import { parsePositiveInt } from "../utils/validation";

const getScopedClubId = (req: Request): string | undefined => {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (req.user.role === "club_staff") {
    if (!req.user.clubId) {
      throw new HttpError(403, "Forbidden");
    }
    return req.user.clubId;
  }
  return undefined;
};

export const getDashboardOverviewStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clubId = getScopedClubId(req);
    const days = parsePositiveInt(req.query.days, "days", 30, 365);
    const stats = await getDashboardOverview(clubId, days);
    res.status(200).json(successResponse(stats));
  } catch (error) {
    next(error);
  }
};

export const getDashboardPlayersByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clubId = getScopedClubId(req);
    const stats = await getPlayersByStatusStats(clubId);
    res.status(200).json(successResponse(stats));
  } catch (error) {
    next(error);
  }
};

export const getDashboardPlayersBySport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clubId = getScopedClubId(req);
    const stats = await getPlayersBySportStats(clubId);
    res.status(200).json(successResponse(stats));
  } catch (error) {
    next(error);
  }
};

export const getDashboardPlayersByClub = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clubId = getScopedClubId(req);
    const stats = await getPlayersByClubStats(clubId);
    res.status(200).json(successResponse(stats));
  } catch (error) {
    next(error);
  }
};

export const getDashboardExpiringContracts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clubId = getScopedClubId(req);
    const days = parsePositiveInt(req.query.days, "days", 30, 365);
    const stats = await getExpiringContractsStats(clubId, days);
    res.status(200).json(successResponse(stats));
  } catch (error) {
    next(error);
  }
};
