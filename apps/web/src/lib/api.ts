import type { ApiErrorBody } from "@coffee-order/contracts";
import { API_BASE_URL } from "./env";

/** Loi tu API, giu nguyen body {code,message,details,requestId} de UI map thong bao. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody | undefined,
  ) {
    super(body?.message ?? `API tra ve ${status}`);
    this.name = "ApiRequestError";
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** Body se duoc JSON.stringify. Khong gui gia tien len server lam nguon chuan. */
  json?: unknown;
  /** Bat buoc cho POST /orders. Xem docs/api-contract.md. */
  idempotencyKey?: string;
}

/**
 * Goi API NestJS.
 *
 * Buoc 05 se bo sung Authorization: Bearer <supabase access token>.
 * Khong bao gio ghi token vao log hay localStorage tu ham nay.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { json, idempotencyKey, headers, ...rest } = options;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(json === undefined ? {} : { "Content-Type": "application/json" }),
      ...(idempotencyKey === undefined ? {} : { "Idempotency-Key": idempotencyKey }),
      ...headers,
    },
    ...(json === undefined ? {} : { body: JSON.stringify(json) }),
  });

  const text = await res.text();
  const parsed: unknown = text.length > 0 ? JSON.parse(text) : undefined;

  if (!res.ok) {
    throw new ApiRequestError(res.status, parsed as ApiErrorBody | undefined);
  }
  return parsed as T;
}
