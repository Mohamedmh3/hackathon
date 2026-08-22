import { ApiResponse } from "../types/api";

export const successResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data
});

export const errorResponse = (message: string): ApiResponse<never> => ({
  success: false,
  error: message
});
