"use client";

import {
  TRACKING_POLL_INTERVAL_MS,
  isTerminalOrderStatus,
  type OrderHistoryEntryDto,
  type OrderResponse,
} from "@coffee-order/contracts";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export const orderKeys = {
  all: ["orders"] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
  history: (id: string) => ["orders", "history", id] as const,
  mine: ["orders", "mine"] as const,
  staffBoard: ["orders", "staff"] as const,
};

/**
 * Theo doi mot don (REQ-503).
 *
 * - Polling moi TRACKING_POLL_INTERVAL_MS (7s, trong khoang 5-10s cua rule).
 * - `refetchIntervalInBackground: false` -> CHI poll khi tab dang hien.
 * - Dung polling khi don vao trang thai terminal.
 * - Refetch khi tab focus lai.
 *
 * UI phai dung timestamp cua SERVER (`createdAt`, history) de hien "cap nhat luc",
 * khong tu gia lap tien trinh.
 */
export function useOrderTracking(orderId: string): UseQueryResult<OrderResponse> {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => apiFetch<OrderResponse>(`/orders/${orderId}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Chua co du lieu -> van poll; terminal -> dung.
      if (status && isTerminalOrderStatus(status)) return false;
      return TRACKING_POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

/** Timeline don. Chi refetch khi focus / sau mutation, khong poll rieng. */
export function useOrderHistory(orderId: string): UseQueryResult<OrderHistoryEntryDto[]> {
  return useQuery({
    queryKey: orderKeys.history(orderId),
    queryFn: () => apiFetch<OrderHistoryEntryDto[]>(`/orders/${orderId}/history`),
    refetchOnWindowFocus: true,
  });
}

/**
 * Invalidate dung cac query sau khi mot mutation doi trang thai don.
 * Goi sau transition / cancel / thu tien.
 */
export function useInvalidateOrder(): (orderId: string) => Promise<void> {
  const qc = useQueryClient();
  return async (orderId: string) => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) }),
      qc.invalidateQueries({ queryKey: orderKeys.history(orderId) }),
      qc.invalidateQueries({ queryKey: orderKeys.mine }),
      qc.invalidateQueries({ queryKey: orderKeys.staffBoard }),
    ]);
  };
}
