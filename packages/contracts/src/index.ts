/**
 * Hop dong cong khai giua apps/web va apps/api.
 *
 * Rang buoc cua goi nay (xem .kiro/steering/tech.md):
 *  - Browser-safe: khong import Prisma client/model, khong dung API chi co o Node,
 *    khong chua secret hay connection string.
 *  - Backend la nguon chuan cua hop dong API. File nay chi khai bao nhung gi
 *    ca hai ben deu can doc, khong chua nghiep vu.
 *
 * Dung const object + union type thay vi `enum` de tuong thich `isolatedModules`
 * va de tree-shake o phia web.
 */

/* ------------------------------------------------------------------ */
/* Enum nghiep vu                                                      */
/* ------------------------------------------------------------------ */

/** Vai tro nguoi dung. Server quan ly trong bang profiles, khong tin client. */
export const UserRole = {
  CUSTOMER: "CUSTOMER",
  STAFF: "STAFF",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Hinh thuc nhan hang. MVP chi dung PICKUP; DELIVERY la nhanh tuong lai. */
export const FulfillmentType = {
  PICKUP: "PICKUP",
  DELIVERY: "DELIVERY",
} as const;
export type FulfillmentType = (typeof FulfillmentType)[keyof typeof FulfillmentType];

/** Phuong thuc thanh toan. MVP chi dung PAY_AT_COUNTER. */
export const PaymentMethod = {
  PAY_AT_COUNTER: "PAY_AT_COUNTER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

/**
 * Trang thai don (pickup).
 * PLACED -> CONFIRMED -> PREPARING -> READY -> COMPLETED.
 * PLACED -> CANCELLED (chu don) | REJECTED (staff dung store / admin, bat buoc ly do).
 * OUT_FOR_DELIVERY chua co API/UI o MVP, chi la nhanh thiet ke tuong lai.
 */
export const OrderStatus = {
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY: "READY",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/** Trang thai ket thuc: khong chuyen tiep duoc nua. */
export const TERMINAL_ORDER_STATUSES = [
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
] as const;

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return (TERMINAL_ORDER_STATUSES as readonly OrderStatus[]).includes(status);
}

/**
 * Trang thai thanh toan, tach roi khoi trang thai don.
 * MVP chi dung UNPAID -> PAID. Cac gia tri con lai danh cho prepay tuong lai
 * va khong co endpoint nao sinh ra chung o ban nay.
 */
export const PaymentStatus = {
  UNPAID: "UNPAID",
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/* ------------------------------------------------------------------ */
/* Lop van chuyen chung                                                */
/* ------------------------------------------------------------------ */

/** Ma loi tra ve cho client. Khong hien truc tiep cho khach, xem docs/wireframes.md. */
export const ApiErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  PRICE_CHANGED: "PRICE_CHANGED",
  ITEM_UNAVAILABLE: "ITEM_UNAVAILABLE",
  IDEMPOTENCY_CONFLICT: "IDEMPOTENCY_CONFLICT",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  VERSION_CONFLICT: "VERSION_CONFLICT",
  QUOTE_ALREADY_USED: "QUOTE_ALREADY_USED",
  QUOTE_EXPIRED: "QUOTE_EXPIRED",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

/** Body loi thong nhat. Khong bao gio chua SQL, stack trace hay token. */
export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
  requestId: string;
}

/** Bao danh sach co phan trang. limit toi da 100, xem docs/api-contract.md. */
export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

/* ------------------------------------------------------------------ */
/* Health va readiness                                                 */
/* ------------------------------------------------------------------ */

/**
 * Liveness. Khong chua secret, khong chua gia tri bien moi truong,
 * khong chua connection string.
 */
export interface HealthResponse {
  status: "ok";
  service: string;
  version: string;
  timestamp: string;
}

/** Ket qua kiem tra tung thanh phan trong readiness. */
export const ReadinessCheckStatus = {
  OK: "OK",
  NOT_CONFIGURED: "NOT_CONFIGURED",
  ERROR: "ERROR",
} as const;
export type ReadinessCheckStatus =
  (typeof ReadinessCheckStatus)[keyof typeof ReadinessCheckStatus];

/**
 * Readiness. Tra 200 khi READY, 503 khi NOT_READY.
 * Kiem tra database duoc bo sung o buoc 04 khi co Prisma; truoc do la NOT_CONFIGURED.
 */
export interface ReadyResponse {
  status: "READY" | "NOT_READY";
  checks: {
    database: ReadinessCheckStatus;
  };
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/* Hang so dung chung                                                  */
/* ------------------------------------------------------------------ */

/** Gioi hanh gio hang, dong bo voi REQ-202 trong docs/requirements.md. */
export const CART_LIMITS = {
  minQuantityPerLine: 1,
  maxQuantityPerLine: 20,
  maxLines: 50,
} as const;

/** Han hieu luc cua quote, dong bo voi REQ-205 (quyet dinh D01-03). */
export const QUOTE_TTL_SECONDS = 300;

/** Tien la integer VND. Dung cho validate bien tren o ca hai phia. */
export const MAX_SIGNED_INT32 = 2147483647;
