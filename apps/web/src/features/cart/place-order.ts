import type {
  CreateOrderRequest,
  OrderResponse,
  QuoteRequest,
} from "@coffee-order/contracts";
import { apiFetch } from "@/lib/api";

/**
 * Dat don tu quote da bao gia.
 *
 * Quy tac quan trong (REQ-301/302, steering bước 08):
 *  - `Idempotency-Key` do CLIENT sinh va PHAI duoc dung lai y nguyen khi retry
 *    (mat mang/timeout). Chi sinh key MOI khi noi dung don thay doi -> tuc la khi
 *    co quote moi.
 *  - KHONG xoa gio truoc khi nhan response thanh cong. Goi `onSuccess` roi moi xoa.
 */
export interface PlaceOrderSession {
  quoteId: string;
  /** Giu nguyen qua cac lan retry cua CUNG noi dung don. */
  idempotencyKey: string;
  cart: QuoteRequest;
}

/** Tao session dat don moi (mot key cho mot quote / mot noi dung don). */
export function startPlaceOrderSession(
  quoteId: string,
  cart: QuoteRequest,
): PlaceOrderSession {
  return { quoteId, idempotencyKey: crypto.randomUUID(), cart };
}

/**
 * Gui POST /v1/orders. Retry an toan: goi lai ham nay voi CUNG session se tra
 * lai dung don cu (server tra 200) thay vi tao don thu hai.
 */
export function placeOrder(session: PlaceOrderSession): Promise<OrderResponse> {
  const payload: CreateOrderRequest = { quoteId: session.quoteId, ...session.cart };
  return apiFetch<OrderResponse>("/orders", {
    method: "POST",
    json: payload,
    idempotencyKey: session.idempotencyKey,
  });
}
