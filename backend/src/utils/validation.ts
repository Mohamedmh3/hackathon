import { HttpError } from "./httpError";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const parseUuid = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new HttpError(400, `${fieldName} must be a valid UUID`);
  }
  return value;
};

export const parseRequiredText = (
  value: unknown,
  fieldName: string,
  minLength = 2,
  maxLength = 120
): string => {
  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} is required`);
  }

  const normalized = value.trim();
  if (normalized.length < minLength || normalized.length > maxLength) {
    throw new HttpError(
      400,
      `${fieldName} must be between ${minLength} and ${maxLength} characters`
    );
  }

  return normalized;
};

export const parseOptionalText = (
  value: unknown,
  fieldName: string,
  maxLength = 255
): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} must be a string`);
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw new HttpError(400, `${fieldName} must be at most ${maxLength} characters`);
  }

  return normalized;
};

export const parseOptionalDate = (value: unknown, fieldName: string): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} must be a date string`);
  }

  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new HttpError(400, `${fieldName} must be in YYYY-MM-DD format`);
  }

  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${fieldName} must be a valid date`);
  }

  return normalized;
};

export const parseRequiredDate = (value: unknown, fieldName: string): string => {
  const parsed = parseOptionalDate(value, fieldName);
  if (!parsed) {
    throw new HttpError(400, `${fieldName} is required`);
  }
  return parsed;
};

export const parsePositiveInt = (
  value: unknown,
  fieldName: string,
  defaultValue: number,
  maxValue: number
): number => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    throw new HttpError(400, `${fieldName} must be a number`);
  }

  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > maxValue) {
    throw new HttpError(400, `${fieldName} must be an integer between 1 and ${maxValue}`);
  }

  return numericValue;
};
