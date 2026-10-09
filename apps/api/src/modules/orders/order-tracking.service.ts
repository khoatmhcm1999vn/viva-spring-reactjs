import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiErrorCode,
  PAGINATION,
  canCollectPayment,
  canTransition,
  type AuthenticatedUser,
  type OrderHistoryEntryDto,
  type OrderListItemDto,
  type OrderResponse,
  type OrderStatus,
  type Paginated,
} from "@coffee-order/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { StoreAccessService } from "../auth/store-access.service";
import { OrdersService } from "./orders.service";
import type {
  CancelOrderDto,
  CollectPaymentDto,
  OrderListQueryDto,
  StaffOrderListQueryDto,
  TransitionDto,
} from "./dto/tracking.dto";

function notFound(message = "Khong tim thay don."): NotFoundException {
  return new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message });
}
function invalidTransition(message: string): ConflictException {
  return new ConflictException({ code: ApiErrorCode.INVALID_TRANSITION, message });
}
function versionConflict(message: string): ConflictException {
  return new ConflictException({ code: ApiErrorCode.VERSION_CONFLICT, message });
}
function validation(message: string): BadRequestException {
  return new BadRequestException({ code: ApiErrorCode.VALIDATION_ERROR, message });
}

/**
 * Xu ly don va tracking (REQ-400..408, REQ-500..504).
 *
 * Moi bat bien duoc kiem o SERVICE:
 *  - Quyen xem: chu don, staff duoc gan store, hoac admin. Nguoi khac -> 404
 *    (khong tiet lo ton tai, khong tra PII).
 *  - Chuyen trang thai: dung do thi ORDER_TRANSITIONS, khong lui/bo buoc.
 *  - CAS theo (id, status, version); history ghi trong CUNG transaction.
 *  - REJECTED bat buoc co ly do; CANCELLED chi chu don tu PLACED.
 *  - Thu tien: chi READY + PAY_AT_COUNTER + UNPAID, CAS theo payment version,
 *    ghi collected_by/paid_at -> khong thu tien hai lan.
 *  - COMPLETED yeu cau READY + PAID.
 */
@Injectable()
export class OrderTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAccess: StoreAccessService,
    private readonly orders: OrdersService,
  ) {}

  /* ===================== Quyen xem ===================== */

  /**
   * Tra ve order (toi thieu) neu user duoc xem, nguoc lai nem 404.
   * Chu don | admin | staff duoc gan dung store.
   */
  private async findViewableOrder(user: AuthenticatedUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, storeId: true, status: true, version: true },
    });
    if (!order) throw notFound();

    const isOwner = order.userId === user.id;
    const isStaffOfStore = await this.storeAccess.canActForStore(user, order.storeId);
    if (!isOwner && !isStaffOfStore) throw notFound();

    return { order, isOwner, isStaffOfStore };
  }

  /** true khi user duoc thay thong tin noi bo (ten nguoi thao tac). */
  private isStaffView(user: AuthenticatedUser): boolean {
    return user.role === "STAFF" || user.role === "ADMIN";
  }

  /* ===================== Doc ===================== */

  /** Chi tiet don: chu don, staff dung store hoac admin. */
  async getOrder(user: AuthenticatedUser, orderId: string): Promise<OrderResponse> {
    await this.findViewableOrder(user, orderId);
    return this.orders.loadOrder(orderId);
  }

  /** Timeline don. actorName chi tra cho staff/admin. */
  async getHistory(
    user: AuthenticatedUser,
    orderId: string,
  ): Promise<OrderHistoryEntryDto[]> {
    await this.findViewableOrder(user, orderId);

    const rows = await this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: { actor: { select: { role: true, fullName: true } } },
    });

    const showActorName = this.isStaffView(user);
    return rows.map((r) => ({
      id: r.id,
      fromStatus: r.fromStatus,
      toStatus: r.toStatus,
      reason: r.reason,
      actorRole: r.actor?.role ?? null,
      actorName: showActorName ? (r.actor?.fullName ?? null) : null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /** Danh sach don cua chinh minh (REQ-500). */
  async listOwnOrders(
    user: AuthenticatedUser,
    query: OrderListQueryDto,
  ): Promise<Paginated<OrderListItemDto>> {
    const page = query.page ?? PAGINATION.defaultPage;
    const limit = Math.min(query.limit ?? PAGINATION.defaultLimit, PAGINATION.maxLimit);
    const where = {
      userId: user.id,
      ...(query.status ? { status: query.status as OrderStatus } : {}),
    };
    return this.paginateOrders(where, page, limit);
  }

  /**
   * Bang don cua staff (REQ-400).
   *
   * Scope do SERVER quyet dinh: STAFF chi thay store duoc gan trong store_staff;
   * ADMIN thay moi store. storeId tu client chi LOC TRONG scope do, khong mo rong.
   */
  async listStaffOrders(
    user: AuthenticatedUser,
    query: StaffOrderListQueryDto,
  ): Promise<Paginated<OrderListItemDto>> {
    const page = query.page ?? PAGINATION.defaultPage;
    const limit = Math.min(query.limit ?? PAGINATION.defaultLimit, PAGINATION.maxLimit);

    let storeFilter: { storeId?: string; storeId_in?: string[] };
    if (user.role === "ADMIN") {
      storeFilter = query.storeId ? { storeId: query.storeId } : {};
    } else {
      const assigned = await this.storeAccess.staffStoreIds(user.id);
      if (assigned.length === 0) {
        return { items: [], page, limit, total: 0 };
      }
      if (query.storeId) {
        // Loc trong scope: store khong duoc gan -> ket qua rong, khong phai 403.
        if (!assigned.includes(query.storeId)) {
          return { items: [], page, limit, total: 0 };
        }
        storeFilter = { storeId: query.storeId };
      } else {
        storeFilter = { storeId_in: assigned };
      }
    }

    const where = {
      ...(storeFilter.storeId ? { storeId: storeFilter.storeId } : {}),
      ...(storeFilter.storeId_in ? { storeId: { in: storeFilter.storeId_in } } : {}),
      ...(query.status ? { status: query.status as OrderStatus } : {}),
    };
    return this.paginateOrders(where, page, limit);
  }

  private async paginateOrders(
    where: Record<string, unknown>,
    page: number,
    limit: number,
  ): Promise<Paginated<OrderListItemDto>> {
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          store: { select: { name: true } },
          payments: { orderBy: { createdAt: "asc" }, take: 1 },
          _count: { select: { items: true } },
        },
      }),
    ]);

    return {
      items: rows.map((o) => ({
        id: o.id,
        code: o.code,
        status: o.status,
        version: o.version,
        storeId: o.storeId,
        storeName: o.storeNameSnapshot || o.store.name,
        itemCount: o._count.items,
        totalVnd: o.totalVnd,
        paymentStatus: o.payments[0]?.status ?? "UNPAID",
        recipientName: o.recipientName,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
      page,
      limit,
      total,
    };
  }

  /* ===================== Chuyen trang thai ===================== */

  /** Staff/admin chuyen trang thai don (REQ-401..404, REQ-407). */
  async transition(
    user: AuthenticatedUser,
    orderId: string,
    dto: TransitionDto,
  ): Promise<OrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: { orderBy: { createdAt: "asc" }, take: 1 } },
    });
    if (!order) throw notFound();

    // Quyen theo store kiem o service (khong chi guard) -> chong cross-store.
    await this.storeAccess.assertCanActForStore(user, order.storeId);

    const to = dto.toStatus as OrderStatus;
    if (!canTransition(order.status, to)) {
      throw invalidTransition(
        `Khong the chuyen tu ${order.status} sang ${to}.`,
      );
    }

    // REJECTED bat buoc co ly do (REQ-404).
    const reason = dto.reason?.trim() || null;
    if (to === "REJECTED" && !reason) {
      throw validation("Tu choi don phai co ly do.");
    }

    // COMPLETED chi khi da thu tien (REQ-407). Kiem truoc CAS cho thong bao ro rang.
    if (to === "COMPLETED" && order.payments[0]?.status !== "PAID") {
      throw invalidTransition("Can thu tien truoc khi hoan tat don.");
    }

    await this.casTransition(orderId, order.status, dto.expectedVersion, to, user.id, reason);
    return this.orders.loadOrder(orderId);
  }

  /** Chu don huy don khi con PLACED (REQ-504). */
  async cancel(
    user: AuthenticatedUser,
    orderId: string,
    dto: CancelOrderDto,
  ): Promise<OrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true },
    });
    // Don cua nguoi khac -> 404, khong tiet lo.
    if (!order || order.userId !== user.id) throw notFound();

    if (!canTransition(order.status, "CANCELLED")) {
      throw invalidTransition(
        "Don da duoc xac nhan nen khong the tu huy. Lien he nhan vien tai quay.",
      );
    }

    const reason = dto.reason?.trim() || null;
    await this.casTransition(
      orderId,
      order.status,
      dto.expectedVersion,
      "CANCELLED",
      user.id,
      reason,
    );
    return this.orders.loadOrder(orderId);
  }

  /**
   * CAS update + history trong CUNG transaction (REQ-401, REQ-403).
   *
   * updateMany voi where {id, status, version}: dung mot cau lenh nen hai staff
   * dua nhau thi chi mot ben co count = 1. Ben kia thay count = 0 -> 409.
   */
  private async casTransition(
    orderId: string,
    fromStatus: OrderStatus,
    expectedVersion: number,
    toStatus: OrderStatus,
    actorId: string,
    reason: string | null,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const res = await tx.order.updateMany({
        where: { id: orderId, status: fromStatus, version: expectedVersion },
        data: { status: toStatus, version: { increment: 1 } },
      });
      if (res.count === 0) {
        throw versionConflict("Don vua duoc cap nhat boi nguoi khac. Tai lai roi thu lai.");
      }
      await tx.orderStatusHistory.create({
        data: { orderId, fromStatus, toStatus, actorId, reason },
      });
    });
  }

  /* ===================== Thu tien ===================== */

  /**
   * Thu tien tai quay (REQ-405, REQ-406).
   *
   * Dieu kien: don o READY, payment PAY_AT_COUNTER va dang UNPAID.
   * CAS theo payment version + status UNPAID -> hai request dong thoi chi mot ben
   * ghi duoc PAID, ben kia 409. Luu collected_by + paid_at lam audit.
   */
  async collectPayment(
    user: AuthenticatedUser,
    orderId: string,
    dto: CollectPaymentDto,
  ): Promise<OrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: { orderBy: { createdAt: "asc" }, take: 1 } },
    });
    if (!order) throw notFound();

    await this.storeAccess.assertCanActForStore(user, order.storeId);

    if (!canCollectPayment(order.status)) {
      throw invalidTransition(
        `Chi thu tien khi don o trang thai READY (hien tai: ${order.status}).`,
      );
    }

    const payment = order.payments[0];
    if (!payment) throw notFound("Don thieu ban ghi thanh toan.");
    if (payment.method !== "PAY_AT_COUNTER") {
      throw invalidTransition("Don nay khong dung hinh thuc tra tai quay.");
    }
    if (payment.status !== "UNPAID") {
      throw invalidTransition("Don nay da duoc thu tien.");
    }

    await this.prisma.$transaction(async (tx) => {
      const res = await tx.payment.updateMany({
        where: { id: payment.id, status: "UNPAID", version: dto.expectedPaymentVersion },
        data: {
          status: "PAID",
          collectedBy: user.id,
          paidAt: new Date(),
          version: { increment: 1 },
        },
      });
      if (res.count === 0) {
        throw versionConflict("Don nay vua duoc thu tien boi nguoi khac.");
      }
    });

    return this.orders.loadOrder(orderId);
  }
}
