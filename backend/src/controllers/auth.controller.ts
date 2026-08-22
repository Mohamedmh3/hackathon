import { NextFunction, Request, Response } from "express";
import { getUserProfile, loginUser, registerUser } from "../services/auth.service";
import { AuthCredentials } from "../types/auth";
import { errorResponse, successResponse } from "../utils/apiResponse";
import { HttpError } from "../utils/httpError";

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

const validateCredentials = (email: unknown, password: unknown): AuthCredentials => {
  if (typeof email !== "string" || !isValidEmail(email)) {
    throw new HttpError(400, "A valid email is required");
  }

  if (typeof password !== "string" || !PASSWORD_REGEX.test(password)) {
    throw new HttpError(400, "Password must be 8-72 characters and include letters and numbers");
  }

  return { email, password };
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = validateCredentials(req.body?.email, req.body?.password);

    if (typeof req.body?.fullName !== "string" || req.body.fullName.trim().length < 2) {
      res.status(400).json(errorResponse("fullName must be at least 2 characters"));
      return;
    }

    const result = await registerUser({
      email,
      password,
      fullName: req.body.fullName.trim()
    });

    res.status(201).json(
      successResponse({
        userId: result.user.id,
        email: result.user.email,
        role: result.profile.role
      })
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = validateCredentials(req.body?.email, req.body?.password);
    const session = await loginUser({ email, password });
    res.status(200).json(successResponse(session));
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const profile = await getUserProfile(req.user.id);

    res.status(200).json(
      successResponse({
        id: req.user.id,
        email: req.user.email,
        profile
      })
    );
  } catch (error) {
    next(error);
  }
};
