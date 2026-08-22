import { NextFunction, Request, Response } from "express";
import { getAuthUser, getUserProfile } from "../services/auth.service";
import { UserRole } from "../types/auth";
import { errorResponse } from "../utils/apiResponse";

const extractBearerToken = (authorizationHeader: string | undefined): string => {
  if (!authorizationHeader) {
    throw new Error("Missing Authorization header");
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new Error("Authorization header is invalid");
  }

  return token;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accessToken = extractBearerToken(req.headers.authorization);
    const authUser = await getAuthUser(accessToken);
    const profile = await getUserProfile(authUser.id);

    req.user = {
      id: authUser.id,
      email: authUser.email ?? profile.email,
      role: profile.role,
      clubId: profile.club_id,
      playerId: profile.player_id
    };

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    res.status(401).json(errorResponse(message));
  }
};

export const requireRoles =
  (...allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json(errorResponse("Forbidden"));
      return;
    }

    next();
  };
