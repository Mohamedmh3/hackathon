import { describe, expect, it } from "vitest";
import { HttpError } from "../src/utils/httpError";
import { parseOptionalText, parseRequiredText, parseUuid } from "../src/utils/validation";

describe("Validation helpers", () => {
  it("accepts valid UUID", () => {
    const result = parseUuid("123e4567-e89b-42d3-a456-556642440000", "id");
    expect(result).toBe("123e4567-e89b-42d3-a456-556642440000");
  });

  it("rejects invalid UUID", () => {
    expect(() => parseUuid("bad-id", "id")).toThrow(HttpError);
  });

  it("normalizes required text", () => {
    const result = parseRequiredText("  Football  ", "name");
    expect(result).toBe("Football");
  });

  it("normalizes optional text and allows empty", () => {
    const result = parseOptionalText("   ", "iconUrl");
    expect(result).toBeNull();
  });
});
