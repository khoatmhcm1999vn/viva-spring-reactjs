"use client";

import { CART_LIMITS, normalizeNote } from "@coffee-order/contracts";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Gio hang phia client (REQ-204, REQ-705).
 *
 * Chi luu ID + size + modifier da sort + quantity + note da normalize +
 * schemaVersion. KHONG luu token hay PII. Gia KHONG luu o day: con so rang buoc
 * den tu quote cua API (bước 07 server-side).
 *
 * Khoa dong (lineKey) = variantId + modifier da sort + note da normalize. Khac
 * cau hinh -> dong rieng, khong gom. Mot gio chi thuoc MOT store (MVP); doi store
 * phai xac nhan bo gio.
 */

const SCHEMA_VERSION = 1;

export interface CartLine {
  /** Khoa on dinh de gom/sua/xoa dong. */
  lineKey: string;
  variantId: string;
  /** De hien thi; khong phai nguon chuan gia. */
  productName: string;
  size: string;
  modifierOptionIds: string[];
  /** Ten modifier de hien thi (song song voi modifierOptionIds). */
  modifierLabels: string[];
  note: string | null;
  quantity: number;
}

export interface AddLineInput {
  variantId: string;
  productName: string;
  size: string;
  modifierOptionIds: string[];
  modifierLabels: string[];
  note?: string | null;
  quantity: number;
}

interface CartState {
  storeId: string | null;
  lines: CartLine[];
  /**
   * Them dong. Neu trung lineKey -> cong don quantity (chan tran maxQuantity).
   * Neu khac store hien tai -> tra ve { storeConflict: true } de UI hoi xac nhan.
   */
  addLine: (storeId: string, input: AddLineInput) => { storeConflict: boolean };
  setQuantity: (lineKey: string, quantity: number) => void;
  removeLine: (lineKey: string) => void;
  clear: () => void;
  /** Bo gio cu va doi sang store moi (goi sau khi khach xac nhan). */
  switchStore: (storeId: string) => void;
  totalLines: () => number;
}

/** Khoa dong on dinh: khac size / tap modifier / note -> khac khoa. */
export function computeLineKey(
  variantId: string,
  modifierOptionIds: string[],
  note: string | null,
): string {
  const sorted = [...modifierOptionIds].sort().join(",");
  return `${variantId}|${sorted}|${note ?? ""}`;
}

function clampQuantity(q: number): number {
  if (q < CART_LIMITS.minQuantityPerLine) return CART_LIMITS.minQuantityPerLine;
  if (q > CART_LIMITS.maxQuantityPerLine) return CART_LIMITS.maxQuantityPerLine;
  return q;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      storeId: null,
      lines: [],

      addLine: (storeId, input) => {
        const state = get();
        // Gio thuoc store khac va dang co dong -> bao xung dot, khong tu xoa.
        if (state.storeId && state.storeId !== storeId && state.lines.length > 0) {
          return { storeConflict: true };
        }

        const note = normalizeNote(input.note);
        const modifierOptionIds = [...input.modifierOptionIds].sort();
        const lineKey = computeLineKey(input.variantId, modifierOptionIds, note);

        set((s) => {
          const existing = s.lines.find((l) => l.lineKey === lineKey);
          if (existing) {
            return {
              storeId,
              lines: s.lines.map((l) =>
                l.lineKey === lineKey
                  ? { ...l, quantity: clampQuantity(l.quantity + input.quantity) }
                  : l,
              ),
            };
          }
          const line: CartLine = {
            lineKey,
            variantId: input.variantId,
            productName: input.productName,
            size: input.size,
            modifierOptionIds,
            modifierLabels: input.modifierLabels,
            note,
            quantity: clampQuantity(input.quantity),
          };
          // Chan vuot so dong toi da.
          if (s.lines.length >= CART_LIMITS.maxLines) return s;
          return { storeId, lines: [...s.lines, line] };
        });
        return { storeConflict: false };
      },

      setQuantity: (lineKey, quantity) =>
        set((s) => ({
          lines: s.lines.map((l) =>
            l.lineKey === lineKey ? { ...l, quantity: clampQuantity(quantity) } : l,
          ),
        })),

      removeLine: (lineKey) =>
        set((s) => {
          const lines = s.lines.filter((l) => l.lineKey !== lineKey);
          return { lines, storeId: lines.length === 0 ? null : s.storeId };
        }),

      clear: () => set({ storeId: null, lines: [] }),

      switchStore: (storeId) => set({ storeId, lines: [] }),

      totalLines: () => get().lines.length,
    }),
    {
      name: "coffee-order-cart",
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Khi doi format: reset an toan ve gio rong thay vi co doc du lieu cu sai cau truc.
      migrate: () => ({ storeId: null, lines: [] }) as Partial<CartState>,
      // Chi luu du lieu gio, khong luu ham.
      partialize: (s) => ({ storeId: s.storeId, lines: s.lines }),
    },
  ),
);
