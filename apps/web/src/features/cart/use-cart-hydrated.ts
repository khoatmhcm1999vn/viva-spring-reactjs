"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "./cart-store";

/**
 * Tra ve true sau khi zustand persist da rehydrate tu localStorage.
 *
 * Dung de tranh hydration mismatch: lan render dau coi gio nhu "chua san sang",
 * UI hien skeleton/loading thay vi render so lieu khac nhau giua server va client.
 *
 * Khoi tao state bang `false` o lan render dau (ca SSR va client deu khop), roi
 * cap nhat trong effect khi persist bao hydrate xong - tranh goi setState dong bo
 * ngay trong than effect.
 */
export function useCartHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const markHydrated = () => setHydrated(true);
    const unsub = useCartStore.persist.onFinishHydration(markHydrated);
    // Neu da hydrate truoc khi effect chay, len lich o microtask (khong dong bo).
    if (useCartStore.persist.hasHydrated()) {
      queueMicrotask(markHydrated);
    }
    return unsub;
  }, []);

  return hydrated;
}
