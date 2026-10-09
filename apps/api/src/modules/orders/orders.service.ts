import { createHash } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiErrorCode,
  canonicalizeQuote,
  type AuthenticatedUser,
  type CreateOrderRequest,
  type OrderResponse,
  type QuoteLine,
} from "@coffee-order/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { QuotePricingService } from "../checkout/quote-pricing.service";
import { generateOrderCode } from "./order-code";

/** Client cua transaction Prisma. */
type TxClient = Parameters<Parameters<PrismaService["$transaction"]>[0]>[0];

function validation(message: string): BadRequestException {
  return new BadRequestException({ code: ApiErrorCode.VALIDATION_ERROR, message });
}
function notFound(message: string): NotFoundException {
  return new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message });
}
function conflict(code: ApiErrorCode, message: string): ConflictException {
  return new ConflictException({ code, message });
}
function gone(message: string): HttpException {
  // 410 QUOTE_EXPIRED theo docs/api-contract.md.
  return new HttpException({ code: ApiErrorCode.QUOTE_EXPIRED, message }, HttpStatus.GONE);
}

/** Ten index unique cua PostgreSQL, dung de biet rang buoc nao bi vi pham. */
const UNIQUE_INDEX = {
  idempotencyUserKey: "idempotency_keys_user_id_key_key",
  orderQuoteId: "orders_quote_id_key",
  orderCode: "orders_code_key",
} as const;

/**
 * Lay TEN INDEX unique bi vi pham tu loi Prisma, hoac null neu khong phai P2002.
 *
 * Prisma 7 + driver adapter `@prisma/adapter-pg` KHONG dien `meta.target`; ten
 * rang buoc nam o `meta.driverAdapterError.cause.constraint.index`. Ham nay doc
 * ca hai cho va fallback sang parse `originalMessage`, roi so khop CHINH XAC ten
 * index - khong dung `includes` vi cac ten deu ket thuc bang `_key` va
 * `orders_code_key` co chua ca chuoi "code".
 */
function uniqueIndexOf(err: unknown): string | null {
  const e = err as { code?: unknown; meta?: Record<string, unknown> } | null;
  if (!e || e.code !== "P2002") return null;
  const meta = e.meta ?? {};

  const cause = (meta.driverAdapterError as { cause?: Record<string, unknown> } | undefined)?.cause;
  const index = (cause?.constraint as { index?: unknown } | undefined)?.index;
  if (typeof index === "string" && index.length > 0) return index;

  // Prisma khong dung adapter: meta.target la string hoac string[].
  const target = meta.target;
  if (typeof target === "string" && target.length > 0) return target;
  if (Array.isArray(target) && target.length > 0) return target.join("_");

  // Fallback cuoi: lay ten trong thong diep goc cua PostgreSQL.
  const original = cause?.originalMessage;
  if (typeof original === "string") {
    const m = /unique constraint "([^"]+)"/.exec(original);
    if (m?.[1]) return m[1];
  }
  return "";
}

export interface CreateOrderResult {
  order: OrderResponse;
  /** true khi day la replay cua request da thanh cong -> controller tra 200 thay vi 201. */
  replay: boolean;
}

/**
 * Tao don an toan (REQ-300..308, domain-rules).
 *
 * Trinh tu:
 *  1. Bam canonical cua cart payload (khong gom quoteId/transport/thoi gian).
 *  2. KIEM REPLAY TRUOC khi kiem quote expiry: request da thanh cong luon tra lai
 *     don cu, ke ca khi quote da het han.
 *  3. Kiem quote: thuoc dung user, dung store, hash khop, chua het han.
 *  4. Trong MOT transaction ngan: claim idempotency key -> khoa cac dong catalog
 *     theo thu tu ID on dinh -> tinh lai gia -> so voi snapshot cua quote ->
 *     insert order + items + modifiers + payment UNPAID + history dau + mapping key.
 *  5. Xung dot unique duoc xu ly SAU rollback (khong truy van trong transaction da
 *     abort): cung key -> doc lai ban ghi da commit va tra don do; cung quote ->
 *     409 QUOTE_ALREADY_USED; trung order code -> chay lai transaction.
 *
 * Khong goi network trong transaction.
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private static readonly MAX_ATTEMPTS = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: QuotePricingService,
  ) {}

  async createOrder(
    user: AuthenticatedUser,
    idempotencyKey: string,
    dto: CreateOrderRequest,
  ): Promise<CreateOrderResult> {
    const { quoteId, ...cart } = dto;
    const canonical = canonicalizeQuote(cart);
    const requestHash = createHash("sha256").update(canonical).digest("hex");

    // --- 2. Replay: kiem TRUOC quote expiry ---
    const replay = await this.findReplay(user.id, idempotencyKey, requestHash);
    if (replay) return { order: replay, replay: true };

    // --- 3. Kiem quote ---
    const quote = await this.prisma.checkoutQuote.findUnique({ where: { id: quoteId } });
    // Khong tiet lo quote cua nguoi khac: tra 404 nhu khong ton tai.
    if (!quote || quote.userId !== user.id) throw notFound("Khong tim thay bao gia.");
    if (quote.storeId !== cart.storeId) {
      throw validation("Bao gia thuoc cua hang khac.");
    }
    if (quote.requestHash !== requestHash) {
      throw validation("Noi dung don khong khop bao gia. Hay bao gia lai.");
    }
    if (quote.expiresAt.getTime() <= Date.now()) {
      throw gone("Bao gia da het hieu luc. Hay cap nhat gia moi.");
    }

    // --- 4/5. Transaction + xu ly xung dot unique sau rollback ---
    for (let attempt = 1; attempt <= OrdersService.MAX_ATTEMPTS; attempt++) {
      try {
        const orderId = await this.runCreateTransaction(
          user,
          idempotencyKey,
          requestHash,
          quote.id,
          Number(quote.totalVnd),
          cart,
        );
        return { order: await this.loadOrder(orderId), replay: false };
      } catch (err) {
        // Moi xu ly duoi day dien ra SAU khi transaction da rollback - khong
        // truy van gi trong transaction da abort.
        const index = uniqueIndexOf(err);
        if (index === null) throw err;

        // Mot quote chi sinh duoc mot don (UNIQUE orders.quote_id).
        if (index === UNIQUE_INDEX.orderQuoteId) {
          throw conflict(ApiErrorCode.QUOTE_ALREADY_USED, "Bao gia nay da duoc dat don.");
        }

        // Cung (user, key) chay dong thoi: luong thua doc lai ban ghi DA COMMIT
        // cua luong thang va tra ve chinh don do.
        if (index === UNIQUE_INDEX.idempotencyUserKey) {
          const committed = await this.findReplay(user.id, idempotencyKey, requestHash);
          if (committed) return { order: committed, replay: true };
          throw conflict(
            ApiErrorCode.IDEMPOTENCY_CONFLICT,
            "Yeu cau dang duoc xu ly. Thu lai sau it giay.",
          );
        }

        // Trung order code: sinh ma moi va chay lai transaction.
        if (index === UNIQUE_INDEX.orderCode && attempt < OrdersService.MAX_ATTEMPTS) {
          this.logger.warn(`Trung order code, thu lai lan ${attempt + 1}.`);
          continue;
        }

        throw err;
      }
    }

    // Het so lan thu vi trung code.
    throw conflict(ApiErrorCode.IDEMPOTENCY_CONFLICT, "Khong tao duoc ma don. Thu lai.");
  }

  /**
   * Tim ban ghi idempotency da commit cho (user, key).
   * - Khac hash -> 409 IDEMPOTENCY_CONFLICT (cung key nhung noi dung khac).
   * - Cung hash + co orderId -> tra don cu.
   * - Cung hash + chua co orderId -> dang xu ly, bao client thu lai.
   */
  private async findReplay(
    userId: string,
    key: string,
    requestHash: string,
  ): Promise<OrderResponse | null> {
    const row = await this.prisma.idempotencyKey.findUnique({
      where: { userId_key: { userId, key } },
    });
    if (!row) return null;

    if (row.requestHash !== requestHash) {
      throw conflict(
        ApiErrorCode.IDEMPOTENCY_CONFLICT,
        "Idempotency-Key da dung cho noi dung khac.",
      );
    }
    if (!row.orderId) {
      throw conflict(
        ApiErrorCode.IDEMPOTENCY_CONFLICT,
        "Yeu cau dang duoc xu ly. Thu lai sau it giay.",
      );
    }
    return this.loadOrder(row.orderId);
  }

  /** Toan bo ghi du lieu nam trong mot transaction. Tra orderId. */
  private async runCreateTransaction(
    user: AuthenticatedUser,
    idempotencyKey: string,
    requestHash: string,
    quoteId: string,
    quoteTotalVnd: number,
    cart: Omit<CreateOrderRequest, "quoteId">,
  ): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      // (a) Claim key truoc: cung (user,key) chay song song se cho o unique index
      //     roi fail bang P2002 -> xu ly sau rollback.
      const mapping = await tx.idempotencyKey.create({
        data: { userId: user.id, key: idempotencyKey, requestHash },
      });

      // (b) Khoa cac dong catalog theo THU TU ID on dinh de tranh deadlock.
      await this.lockCatalogRows(tx, cart.items.map((i) => i.variantId));

      // (c) Tinh lai gia tu catalog da khoa (khong tin gia client, khong tin snapshot).
      const priced = await this.pricing.priceQuote(tx, cart);

      // (d) So voi snapshot cua quote: lech -> PRICE_CHANGED.
      if (priced.subtotalVnd !== quoteTotalVnd) {
        throw conflict(
          ApiErrorCode.PRICE_CHANGED,
          `Gia vua thay doi. Tong moi la ${priced.subtotalVnd} VND.`,
        );
      }

      const store = await tx.store.findUniqueOrThrow({ where: { id: cart.storeId } });

      // (e) Order: snapshot store + nguoi nhan; total = subtotal (ship=discount=0).
      const order = await tx.order.create({
        data: {
          code: generateOrderCode(),
          userId: user.id,
          storeId: cart.storeId,
          quoteId,
          fulfillmentType: "PICKUP",
          status: "PLACED",
          subtotalVnd: priced.subtotalVnd,
          shippingFeeVnd: 0,
          discountVnd: 0,
          totalVnd: priced.subtotalVnd,
          recipientName: cart.recipient.name.trim(),
          recipientPhone: cart.recipient.phone.trim(),
          storeNameSnapshot: store.name,
          storeAddressSnapshot: store.address,
          version: 0,
        },
      });

      // (f) Items + modifiers snapshot.
      await this.insertItems(tx, order.id, priced.lines);

      // (g) Payment UNPAID duy nhat (partial unique o DB dam bao mot ban ghi
      //     PAY_AT_COUNTER moi don).
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: "PAY_AT_COUNTER",
          status: "UNPAID",
          amountVnd: priced.subtotalVnd,
          version: 0,
        },
      });

      // (h) History dau tien: from_status = null.
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, fromStatus: null, toStatus: "PLACED", actorId: user.id },
      });

      // (i) Gan order vao mapping key (UNIQUE orders.quote_id da chan quote dung 2 lan).
      await tx.idempotencyKey.update({
        where: { id: mapping.id },
        data: { orderId: order.id },
      });

      return order.id;
    });
  }

  /**
   * Insert order_items + order_item_modifiers.
   *
   * Tach thanh method rieng (protected) de test co the ghi de, nem loi giua chuoi
   * insert va chung minh transaction rollback sach - khong can fault-injection
   * trong code production.
   */
  protected async insertItems(
    tx: TxClient,
    orderId: string,
    lines: QuoteLine[],
  ): Promise<void> {
    for (const line of lines) {
      const item = await tx.orderItem.create({
        data: {
          orderId,
          variantId: line.variantId,
          productNameSnapshot: line.productName,
          sizeSnapshot: line.size,
          basePriceVnd: line.basePriceVnd,
          unitPriceVnd: line.unitPriceVnd,
          quantity: line.quantity,
          lineTotalVnd: line.lineTotalVnd,
          note: line.note,
        },
      });
      if (line.modifiers.length > 0) {
        await tx.orderItemModifier.createMany({
          data: line.modifiers.map((m) => ({
            orderItemId: item.id,
            optionId: m.optionId,
            groupNameSnapshot: m.groupName,
            optionNameSnapshot: m.optionName,
            extraPriceVnd: m.extraPriceVnd,
          })),
        });
      }
    }
  }

  /**
   * Khoa cac dong product_variants can dung bang SELECT ... FOR UPDATE, sap xep
   * theo id de moi luong khoa cung thu tu -> khong deadlock (domain-rules).
   * Thay doi catalog dong thoi phai cho den khi transaction nay commit.
   */
  private async lockCatalogRows(tx: TxClient, variantIds: string[]): Promise<void> {
    const unique = [...new Set(variantIds)].sort();
    if (unique.length === 0) return;
    await tx.$queryRaw`
      SELECT id FROM product_variants
      WHERE id = ANY(${unique}::uuid[])
      ORDER BY id
      FOR UPDATE
    `;
  }

  /**
   * Chi tiet don cho CHU DON (REQ-502).
   *
   * Kiem quyen o SERVICE: don cua nguoi khac tra 404 (khong tiet lo ton tai, va
   * khong tra PII). Ma don khong phai secret cap quyen.
   */
  async getOrderForOwner(user: AuthenticatedUser, orderId: string): Promise<OrderResponse> {
    const owner = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });
    if (!owner || owner.userId !== user.id) throw notFound("Khong tim thay don.");
    return this.loadOrder(orderId);
  }

  /** Doc don day du de tra ve. Dung cho ca tao moi va replay. */
  async loadOrder(orderId: string): Promise<OrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { modifiers: true }, orderBy: { id: "asc" } },
        payments: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!order) throw notFound("Khong tim thay don.");

    const payment = order.payments[0];
    if (!payment) throw notFound("Don thieu ban ghi thanh toan.");

    return {
      id: order.id,
      code: order.code,
      status: order.status,
      version: order.version,
      fulfillmentType: order.fulfillmentType,
      storeId: order.storeId,
      storeName: order.storeNameSnapshot,
      storeAddress: order.storeAddressSnapshot,
      recipientName: order.recipientName,
      recipientPhone: order.recipientPhone,
      pickupNote: order.pickupNote,
      items: order.items.map((it) => ({
        id: it.id,
        variantId: it.variantId,
        productName: it.productNameSnapshot,
        size: it.sizeSnapshot,
        basePriceVnd: it.basePriceVnd,
        unitPriceVnd: it.unitPriceVnd,
        quantity: it.quantity,
        lineTotalVnd: it.lineTotalVnd,
        note: it.note,
        modifiers: it.modifiers.map((m) => ({
          optionId: m.optionId,
          groupName: m.groupNameSnapshot,
          optionName: m.optionNameSnapshot,
          extraPriceVnd: m.extraPriceVnd,
        })),
      })),
      totals: {
        subtotalVnd: order.subtotalVnd,
        shippingFeeVnd: order.shippingFeeVnd,
        discountVnd: order.discountVnd,
        totalVnd: order.totalVnd,
      },
      payment: {
        id: payment.id,
        method: payment.method,
        status: payment.status,
        amountVnd: payment.amountVnd,
        paidAt: payment.paidAt?.toISOString() ?? null,
        version: payment.version,
      },
      createdAt: order.createdAt.toISOString(),
    };
  }
}
