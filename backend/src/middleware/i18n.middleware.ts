import { NextFunction, Request, Response } from "express";
import { resolveLocale, translateMessage } from "../i18n/messages";

export const localizeApiResponse = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    if (!body || typeof body !== "object") {
      return originalJson(body);
    }

    const locale = resolveLocale(req.headers["accept-language"]);
    const payload = body as { success?: boolean; error?: unknown; data?: unknown };

    if (payload.success === false && typeof payload.error === "string") {
      return originalJson({
        ...payload,
        error: translateMessage(payload.error, locale)
      });
    }

    if (
      payload.success === true &&
      payload.data &&
      typeof payload.data === "object" &&
      "message" in (payload.data as Record<string, unknown>) &&
      typeof (payload.data as Record<string, unknown>).message === "string"
    ) {
      const data = payload.data as Record<string, unknown>;
      return originalJson({
        ...payload,
        data: {
          ...data,
          message: translateMessage(data.message as string, locale)
        }
      });
    }

    return originalJson(body);
  }) as Response["json"];

  next();
};
