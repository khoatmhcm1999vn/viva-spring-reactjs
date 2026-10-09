import type {
  CancelOrderRequest,
  CollectPaymentRequest,
  OrderListItemDto,
  OrderResponse,
  OrderStatus,
  Paginated,
  TransitionRequest,
} from "@coffee-order/contracts";
import { apiFetch } from "@/lib/api";

/** Lich su don cua chinh minh. */
export function fetchMyOrders(params: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}): Promise<Paginated<OrderListItemDto>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  const suffix = qs.size > 0 ? `?${qs.toString()}` : "";
  return apiFetch<Paginated<OrderListItemDto>>(`/me/orders${suffix}`);
}

/**
 * Bang don cua staff.
 *
 * Scope do SERVER quyet dinh tu store_staff; `storeId` o day chi la bo loc trong
 * pham vi do - khong mo rong quyen.
 */
export function fetchStaffOrders(params: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  storeId?: string;
}): Promise<Paginated<OrderListItemDto>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.storeId) qs.set("storeId", params.storeId);
  const suffix = qs.size > 0 ? `?${qs.toString()}` : "";
  return apiFetch<Paginated<OrderListItemDto>>(`/staff/orders${suffix}`);
}

/**
 * Chuyen trang thai don (staff/admin).
 * `expectedVersion` phai lay tu don vua doc; lech -> API tra 409 VERSION_CONFLICT
 * va UI phai refetch roi hien lai dung bo nut.
 */
export function transitionOrder(
  orderId: string,
  body: TransitionRequest,
): Promise<OrderResponse> {
  return apiFetch<OrderResponse>(`/staff/orders/${orderId}/transitions`, {
    method: "POST",
    json: body,
  });
}

/** Thu tien tai quay. Dung version cua PAYMENT, khong phai cua order. */
export function collectPayment(
  orderId: string,
  body: CollectPaymentRequest,
): Promise<OrderResponse> {
  return apiFetch<OrderResponse>(`/staff/orders/${orderId}/payments`, {
    method: "POST",
    json: body,
  });
}

/** Chu don huy don (chi khi con PLACED). */
export function cancelOrder(
  orderId: string,
  body: CancelOrderRequest,
): Promise<OrderResponse> {
  return apiFetch<OrderResponse>(`/orders/${orderId}/cancel`, { method: "POST", json: body });
}
