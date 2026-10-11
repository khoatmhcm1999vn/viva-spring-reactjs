"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTE_MAX_LENGTH = exports.MAX_SIGNED_INT32 = exports.QUOTE_TTL_SECONDS = exports.CART_LIMITS = exports.PAGINATION = exports.TRACKING_POLL_INTERVAL_MS = exports.ReadinessCheckStatus = exports.ApiErrorCode = exports.PaymentStatus = exports.REASON_MAX_LENGTH = exports.PAYMENT_COLLECTABLE_STATUSES = exports.ORDER_TRANSITIONS = exports.TERMINAL_ORDER_STATUSES = exports.OrderStatus = exports.PaymentMethod = exports.FulfillmentType = exports.UserRole = void 0;
exports.isTerminalOrderStatus = isTerminalOrderStatus;
exports.canTransition = canTransition;
exports.canCollectPayment = canCollectPayment;
exports.normalizeNote = normalizeNote;
exports.canonicalizeQuote = canonicalizeQuote;
/* ------------------------------------------------------------------ */
/* Enum nghiep vu                                                      */
/* ------------------------------------------------------------------ */
/** Vai tro nguoi dung. Server quan ly trong bang profiles, khong tin client. */
exports.UserRole = {
    CUSTOMER: "CUSTOMER",
    STAFF: "STAFF",
    ADMIN: "ADMIN",
};
/** Hinh thuc nhan hang. MVP chi dung PICKUP; DELIVERY la nhanh tuong lai. */
exports.FulfillmentType = {
    PICKUP: "PICKUP",
    DELIVERY: "DELIVERY",
};
/** Phuong thuc thanh toan. MVP chi dung PAY_AT_COUNTER. */
exports.PaymentMethod = {
    PAY_AT_COUNTER: "PAY_AT_COUNTER",
};
/**
 * Trang thai don (pickup).
 * PLACED -> CONFIRMED -> PREPARING -> READY -> COMPLETED.
 * PLACED -> CANCELLED (chu don) | REJECTED (staff dung store / admin, bat buoc ly do).
 * OUT_FOR_DELIVERY chua co API/UI o MVP, chi la nhanh thiet ke tuong lai.
 */
exports.OrderStatus = {
    PLACED: "PLACED",
    CONFIRMED: "CONFIRMED",
    PREPARING: "PREPARING",
    READY: "READY",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    REJECTED: "REJECTED",
};
/** Trang thai ket thuc: khong chuyen tiep duoc nua. */
exports.TERMINAL_ORDER_STATUSES = [
    exports.OrderStatus.COMPLETED,
    exports.OrderStatus.CANCELLED,
    exports.OrderStatus.REJECTED,
];
function isTerminalOrderStatus(status) {
    return exports.TERMINAL_ORDER_STATUSES.includes(status);
}
/**
 * Do thi chuyen trang thai hop le (pickup, MVP).
 *
 * Tien dan: PLACED -> CONFIRMED -> PREPARING -> READY -> COMPLETED.
 * Ket thuc som: PLACED -> CANCELLED (chu don) | REJECTED (staff dung store/admin).
 * KHONG lui buoc, KHONG bo buoc, khong chuyen tu trang thai terminal.
 *
 * Dung chung client/server: UI chi hien nut cho cac transition co trong day.
 */
exports.ORDER_TRANSITIONS = {
    PLACED: [exports.OrderStatus.CONFIRMED, exports.OrderStatus.CANCELLED, exports.OrderStatus.REJECTED],
    CONFIRMED: [exports.OrderStatus.PREPARING],
    PREPARING: [exports.OrderStatus.READY],
    READY: [exports.OrderStatus.COMPLETED],
    COMPLETED: [],
    CANCELLED: [],
    REJECTED: [],
};
function canTransition(from, to) {
    return exports.ORDER_TRANSITIONS[from].includes(to);
}
/**
 * Trang thai cho phep STAFF thu tien (PAY_AT_COUNTER).
 *
 * Chi READY: khach den quay lay mon thi tra tien. Giu bat bien "khong co duong
 * hoan tien" vi huy/tu choi chi xay ra o PLACED, ma PLACED khong thu duoc tien.
 */
exports.PAYMENT_COLLECTABLE_STATUSES = [exports.OrderStatus.READY];
function canCollectPayment(status) {
    return exports.PAYMENT_COLLECTABLE_STATUSES.includes(status);
}
/** Do dai toi da cua ly do tu choi / huy. */
exports.REASON_MAX_LENGTH = 300;
/**
 * Trang thai thanh toan, tach roi khoi trang thai don.
 * MVP chi dung UNPAID -> PAID. Cac gia tri con lai danh cho prepay tuong lai
 * va khong co endpoint nao sinh ra chung o ban nay.
 */
exports.PaymentStatus = {
    UNPAID: "UNPAID",
    PENDING: "PENDING",
    PAID: "PAID",
    FAILED: "FAILED",
    REFUND_PENDING: "REFUND_PENDING",
    REFUNDED: "REFUNDED",
};
/* ------------------------------------------------------------------ */
/* Lop van chuyen chung                                                */
/* ------------------------------------------------------------------ */
/** Ma loi tra ve cho client. Khong hien truc tiep cho khach, xem docs/wireframes.md. */
exports.ApiErrorCode = {
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
};
/** Ket qua kiem tra tung thanh phan trong readiness. */
exports.ReadinessCheckStatus = {
    OK: "OK",
    NOT_CONFIGURED: "NOT_CONFIGURED",
    ERROR: "ERROR",
};
/* ------------------------------------------------------------------ */
/* Hang so dung chung                                                  */
/* ------------------------------------------------------------------ */
/** Chu ky polling tracking (REQ-503, quyet dinh D02-03). */
exports.TRACKING_POLL_INTERVAL_MS = 7000;
/** Gioi han phan trang danh sach. limit toi da 100 (xem docs/api-contract.md). */
exports.PAGINATION = {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
};
/** Gioi hanh gio hang, dong bo voi REQ-202 trong docs/requirements.md. */
exports.CART_LIMITS = {
    minQuantityPerLine: 1,
    maxQuantityPerLine: 20,
    maxLines: 50,
};
/** Han hieu luc cua quote, dong bo voi REQ-205 (quyet dinh D01-03). */
exports.QUOTE_TTL_SECONDS = 300;
/** Tien la integer VND. Dung cho validate bien tren o ca hai phia. */
exports.MAX_SIGNED_INT32 = 2147483647;
/** Do dai toi da cua ghi chu moi dong (REQ gioi han note). */
exports.NOTE_MAX_LENGTH = 200;
/* ------------------------------------------------------------------ */
/* Chuan hoa canonical cho quote / idempotency                         */
/* ------------------------------------------------------------------ */
/**
 * Chuan hoa ghi chu: trim hai dau, gom moi chuoi khoang trang (gom xuong dong)
 * thanh mot dau cach. Rong -> null. Dung chung client va server de hash khop.
 */
function normalizeNote(note) {
    if (note === null || note === undefined)
        return null;
    const trimmed = note.replace(/\s+/g, " ").trim();
    return trimmed.length === 0 ? null : trimmed;
}
function canonicalizeQuote(input) {
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
//# sourceMappingURL=index.js.map