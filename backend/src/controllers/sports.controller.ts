import { NextFunction, Request, Response } from "express";
import { createSport, deleteSport, listSports, updateSport } from "../services/sports.service";
import { successResponse } from "../utils/apiResponse";
import { HttpError } from "../utils/httpError";
import { parseOptionalText, parseRequiredText, parseUuid } from "../utils/validation";

export const getSports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = parseOptionalText(req.query.search, "search", 120) ?? undefined;
    const sports = await listSports(search);
    res.status(200).json(successResponse(sports));
  } catch (error) {
    next(error);
  }
};

export const postSport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const name = parseRequiredText(req.body?.name, "name");
    const iconUrl = parseOptionalText(req.body?.iconUrl, "iconUrl", 500);
    const sport = await createSport({ name, iconUrl });
    res.status(201).json(successResponse(sport));
  } catch (error) {
    next(error);
  }
};

export const patchSport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sportId = parseUuid(req.params.id, "id");
    const name = req.body?.name === undefined ? undefined : parseRequiredText(req.body.name, "name");
    const iconUrl =
      req.body?.iconUrl === undefined ? undefined : parseOptionalText(req.body.iconUrl, "iconUrl", 500);

    if (name === undefined && iconUrl === undefined) {
      throw new HttpError(400, "At least one field is required: name, iconUrl");
    }

    const sport = await updateSport(sportId, { name, iconUrl });
    res.status(200).json(successResponse(sport));
  } catch (error) {
    next(error);
  }
};

export const removeSport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sportId = parseUuid(req.params.id, "id");
    await deleteSport(sportId);
    res.status(200).json(successResponse({ deleted: true }));
  } catch (error) {
    next(error);
  }
};
