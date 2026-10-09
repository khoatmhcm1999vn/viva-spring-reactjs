import { randomUUID } from "node:crypto";
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

/** Ten header tra ve cho client de doi chieu log. */
export const REQUEST_ID_HEADER = "x-request-id";

/** Thuoc tinh gan vao request de filter/log doc lai. */
export const REQUEST_ID_KEY = "requestId";

export interface RequestWithId extends Request {
  [REQUEST_ID_KEY]?: string;
}

/**
 * Gan mot requestId cho moi request va tra lai qua response header.
 *
 * Header do client gui chi duoc nhan khi dang o dinh dang UUID: tranh viec
 * client chen gia tri tuy y vao log (log injection).
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private static readonly UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const incoming = req.header(REQUEST_ID_HEADER);
    const id =
      incoming && RequestIdMiddleware.UUID_RE.test(incoming) ? incoming : randomUUID();

    req[REQUEST_ID_KEY] = id;
    res.setHeader(REQUEST_ID_HEADER, id);
    next();
  }
}
