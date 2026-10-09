import type { ApiErrorBody } from "@coffee-order/contracts";
import { API_BASE_URL } from "./env";
import { getAccessToken, refreshSessionOnce } from "./supabase";

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
  /** true (mac dinh) = gan Bearer token neu co phien. Dat false cho route cong khai. */
  auth?: boolean;
}

async function doFetch(
  path: string,
  options: ApiFetchOptions,
  accessToken: string | null,
): Promise<Response> {
  const { json, idempotencyKey, headers, auth: _auth, ...rest } = options;
  return fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(json === undefined ? {} : { "Content-Type": "application/json" }),
      ...(idempotencyKey === undefined ? {} : { "Idempotency-Key": idempotencyKey }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    ...(json === undefined ? {} : { body: JSON.stringify(json) }),
  });
}

/**
 * Goi API NestJS.
 *
 * - Gan Authorization: Bearer <access token> khi co phien (tru khi auth=false).
 * - Khi API tra 401: thu refresh phien DUNG MOT LAN roi goi lai. Khong vong lap
 *   retry (yeu cau .kiro/steering/05-auth-rbac.md). 401 lan hai -> nem loi de
 *   UI dieu huong dang nhap.
 * - KHONG log token, khong luu token ngoai co che cua Supabase SDK.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const useAuth = options.auth !== false;
  const token = useAuth ? await getAccessToken() : null;

  let res = await doFetch(path, options, token);

  // 401 + dang dung auth: thu refresh mot lan.
  if (res.status === 401 && useAuth) {
    const refreshed = await refreshSessionOnce();
    if (refreshed) {
      res = await doFetch(path, options, refreshed);
    }
  }

  const text = await res.text();
  const parsed: unknown = text.length > 0 ? JSON.parse(text) : undefined;

  if (!res.ok) {
    throw new ApiRequestError(res.status, parsed as ApiErrorBody | undefined);
  }
  return parsed as T;
}
