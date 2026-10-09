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
/* Nguoi dung da xac thuc                                              */
/* ------------------------------------------------------------------ */

/**
 * Thong tin nguoi dung sau khi backend xac minh Supabase access token va map
 * sub -> profiles. role LUON lay tu DB (profiles.role), khong tu token/metadata.
 */
export interface AuthenticatedUser {
  /** = profiles.id = Supabase auth sub */
  id: string;
  role: UserRole;
  isActive: boolean;
  email: string | null;
}

/** Response cua GET /v1/me. Khong chua token hay bat ky secret nao. */
export interface MeResponse {
  id: string;
  role: UserRole;
  fullName: string | null;
  phone: string | null;
  isActive: boolean;
  /** Danh sach store_id ma user duoc gan lam STAFF (rong voi CUSTOMER/ADMIN). */
  staffStoreIds: string[];
}

/* ------------------------------------------------------------------ */
/* Catalog (bước 06)                                                   */
/* ------------------------------------------------------------------ */

/** Danh muc cong khai. */
export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Variant (size) trong response catalog.
 * `available` chi co khi truy van kem storeId: phan anh store_variants.is_available
 * cua dung store do. Khong co storeId -> available = null (khong xet theo store).
 */
export interface VariantDto {
  id: string;
  sku: string;
  size: string;
  priceVnd: number;
  isActive: boolean;
  /** null khi khong loc theo store; true/false khi co storeId. */
  available: boolean | null;
}

/** Tuy chon trong mot nhom modifier. */
export interface ModifierOptionDto {
  id: string;
  name: string;
  extraPriceVnd: number;
  isActive: boolean;
}

/** Nhom modifier ap dung cho mot mon, kem luat min/max. */
export interface ModifierGroupDto {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: ModifierOptionDto[];
}

/** Mon trong danh sach (chua kem modifier chi tiet). */
export interface ProductListItemDto {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  imagePath: string | null;
  isActive: boolean;
  variants: VariantDto[];
  /** Gia variant thap nhat con ban (sau khi loc theo store neu co). null khi khong co variant kha dung. */
  fromPriceVnd: number | null;
}

/** Chi tiet mon: them modifier rules. */
export interface ProductDetailDto extends ProductListItemDto {
  modifierGroups: ModifierGroupDto[];
}

/* ------------------------------------------------------------------ */
/* Gio hang va bao gia (bước 07)                                       */
/* ------------------------------------------------------------------ */

/**
 * Mot dong gio hang gui len de bao gia / dat don.
 * Client CHI gui ID + so luong + lua chon; KHONG gui gia (REQ-200).
 */
export interface QuoteItemInput {
  variantId: string;
  quantity: number;
  /** ID cac modifier option da chon. MVP moi option quantity = 1, khong trung. */
  modifierOptionIds: string[];
  /** Ghi chu cho dong; se duoc normalize (trim + gom khoang trang) truoc khi hash. */
  note?: string | null;
}

/** Thong tin nguoi nhan tai quay. */
export interface RecipientInput {
  name: string;
  phone: string;
}

/**
 * Request bao gia. MVP chi PICKUP + PAY_AT_COUNTER.
 * Dung chung cho POST /checkout/quote va (o bước 08) phan cart cua POST /orders.
 */
export interface QuoteRequest {
  storeId: string;
  fulfillmentType: "PICKUP";
  paymentMethod: "PAY_AT_COUNTER";
  recipient: RecipientInput;
  items: QuoteItemInput[];
}

/** Mot modifier da chon trong dong bao gia, kem gia tai thoi diem bao gia. */
export interface QuoteLineModifier {
  optionId: string;
  groupName: string;
  optionName: string;
  extraPriceVnd: number;
}

/**
 * Mot dong trong bao gia, da tinh gia o server.
 * unitPriceVnd = basePriceVnd + tong extraPriceVnd cua modifiers.
 * lineTotalVnd = unitPriceVnd * quantity.
 */
export interface QuoteLine {
  variantId: string;
  productName: string;
  size: string;
  basePriceVnd: number;
  unitPriceVnd: number;
  quantity: number;
  lineTotalVnd: number;
  modifiers: QuoteLineModifier[];
  note: string | null;
}

/**
 * Response bao gia. subtotal = tong lineTotal; MVP shipping = discount = 0 nen
 * total = subtotal. Gia o day la nguon chuan cho dat don (bước 08).
 */
export interface QuoteResponse {
  quoteId: string;
  expiresAt: string;
  items: QuoteLine[];
  subtotalVnd: number;
  shippingFeeVnd: 0;
  discountVnd: 0;
  totalVnd: number;
}

/* ------------------------------------------------------------------ */
/* Hang so dung chung                                                  */
/* ------------------------------------------------------------------ */

/** Gioi han phan trang danh sach. limit toi da 100 (xem docs/api-contract.md). */
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

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

/** Do dai toi da cua ghi chu moi dong (REQ gioi han note). */
export const NOTE_MAX_LENGTH = 200;

/* ------------------------------------------------------------------ */
/* Chuan hoa canonical cho quote / idempotency                         */
/* ------------------------------------------------------------------ */

/**
 * Chuan hoa ghi chu: trim hai dau, gom moi chuoi khoang trang (gom xuong dong)
 * thanh mot dau cach. Rong -> null. Dung chung client va server de hash khop.
 */
export function normalizeNote(note: string | null | undefined): string | null {
  if (note === null || note === undefined) return null;
  const trimmed = note.replace(/\s+/g, " ").trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Dang canonical cua request bao gia, dung lam dau vao bam (request_hash) va la
 * noi dung "cart payload" ma POST /orders phai khop (bước 08).
 *
 * Quy tac on dinh:
 *  - modifierOptionIds sap xep tang dan (thu tu chon khong anh huong).
 *  - items sap xep theo khoa (variantId, modifiers da sort, note) de thu tu dong
 *    khong anh huong; dong trung cau hinh y het KHONG tu gom (giu rieng) nhung
 *    canonical van on dinh.
 *  - note da normalize.
 *  - KHONG gom transport/requestId/thoi gian vao canonical.
 *
 * Tra ve chuoi JSON on dinh (khong phai hash). Ben goi bam bang thuat toan cua
 * minh (server: crypto SHA-256) de tranh phu thuoc crypto trong goi browser-safe.
 */
export interface CanonicalQuoteInput {
  storeId: string;
  fulfillmentType: string;
  paymentMethod: string;
  recipient: { name: string; phone: string };
  items: Array<{
    variantId: string;
    quantity: number;
    modifierOptionIds: string[];
    note?: string | null;
  }>;
}

export function canonicalizeQuote(input: CanonicalQuoteInput): string {
  const items = input.items
    .map((it) => ({
      variantId: it.variantId,
      quantity: it.quantity,
      modifierOptionIds: [...it.modifierOptionIds].sort(),
      note: normalizeNote(it.note),
    }))
    .sort((a, b) => {
      const ka = `${a.variantId}|${a.modifierOptionIds.join(",")}|${a.note ?? ""}`;
      const kb = `${b.variantId}|${b.modifierOptionIds.join(",")}|${b.note ?? ""}`;
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });

  return JSON.stringify({
    storeId: input.storeId,
    fulfillmentType: input.fulfillmentType,
    paymentMethod: input.paymentMethod,
    recipient: {
      name: input.recipient.name.trim(),
      phone: input.recipient.phone.trim(),
    },
    items,
  });
}
