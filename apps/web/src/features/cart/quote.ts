import type { QuoteRequest, QuoteResponse, RecipientInput } from "@coffee-order/contracts";
import { apiFetch } from "@/lib/api";
import type { CartLine } from "./cart-store";

/**
 * Dung QuoteRequest tu gio + thong tin nguoi nhan.
 *
 * Payload nay CHINH LA cart payload ma POST /orders se gui kem quoteId (bước 08),
 * nen canonical hash khop. Client khong gui gia.
 */
export function buildQuoteRequest(
  storeId: string,
  recipient: RecipientInput,
  lines: CartLine[],
): QuoteRequest {
  return {
    storeId,
    fulfillmentType: "PICKUP",
    paymentMethod: "PAY_AT_COUNTER",
    recipient,
    items: lines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
      modifierOptionIds: l.modifierOptionIds,
      note: l.note,
    })),
  };
}

/** Goi POST /v1/checkout/quote. Nem ApiRequestError khi loi (UI xu ly theo code). */
export function requestQuote(req: QuoteRequest): Promise<QuoteResponse> {
  return apiFetch<QuoteResponse>("/checkout/quote", { method: "POST", json: req });
}
