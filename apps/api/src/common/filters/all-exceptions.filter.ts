import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ApiErrorCode, type ApiErrorBody } from "@coffee-order/contracts";
import type { Response } from "express";
import { REQUEST_ID_KEY, type RequestWithId } from "../middleware/request-id.middleware";

/** Map HTTP status -> ma loi mac dinh, dung khi exception khong tu khai bao ma. */
const STATUS_TO_CODE: Partial<Record<number, ApiErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ApiErrorCode.VALIDATION_ERROR,
  [HttpStatus.UNAUTHORIZED]: ApiErrorCode.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: ApiErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ApiErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ApiErrorCode.VERSION_CONFLICT,
  [HttpStatus.GONE]: ApiErrorCode.QUOTE_EXPIRED,
  [HttpStatus.TOO_MANY_REQUESTS]: ApiErrorCode.RATE_LIMITED,
};

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === "string" && value in ApiErrorCode;
}

/**
 * Filter loi toan cuc.
 *
 * Bao dam:
 *  - Body loi luon theo dang {code, message, details, requestId} (docs/api-contract.md).
 *  - KHONG tra stack trace, SQL, ten bien moi truong hay token ra ngoai.
 *  - Loi 5xx chi tra message chung; chi tiet that chi nam trong log server.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<RequestWithId>();
    const requestId = req[REQUEST_ID_KEY] ?? "unknown";

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ApiErrorBody =
      status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? {
            // 5xx: khong tiet lo noi dung loi that ra ngoai.
            code: ApiErrorCode.INTERNAL_ERROR,
            message: "Da co loi phia he thong. Thu lai sau.",
            requestId,
          }
        : this.buildClientError(exception, status, requestId);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${requestId}] ${req.method} ${req.originalUrl} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${requestId}] ${req.method} ${req.originalUrl} -> ${status} ${body.code}`,
      );
    }

    res.status(status).json(body);
  }

  private buildClientError(
    exception: unknown,
    status: number,
    requestId: string,
  ): ApiErrorBody {
    const fallbackCode = STATUS_TO_CODE[status] ?? ApiErrorCode.VALIDATION_ERROR;

    if (!(exception instanceof HttpException)) {
      return { code: fallbackCode, message: "Yeu cau khong hop le.", requestId };
    }

    const payload = exception.getResponse();

    if (typeof payload === "string") {
      return { code: fallbackCode, message: payload, requestId };
    }

    const obj = payload as Record<string, unknown>;
    const code = isApiErrorCode(obj.code) ? obj.code : fallbackCode;
    const message =
      typeof obj.message === "string"
        ? obj.message
        : Array.isArray(obj.message)
          ? "Du lieu gui len khong hop le."
          : exception.message;

    // ValidationPipe tra message dang array; dat vao details de client map theo field.
    const details = Array.isArray(obj.message) ? obj.message : obj.details;

    return details === undefined
      ? { code, message, requestId }
      : { code, message, details, requestId };
  }
}
