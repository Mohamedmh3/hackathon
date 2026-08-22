import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";
import { errorResponse } from "../utils/apiResponse";

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(errorResponse(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json(errorResponse(error.message));
    return;
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json(errorResponse(message));
};
