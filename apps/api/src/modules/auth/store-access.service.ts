import { ForbiddenException, Injectable } from "@nestjs/common";
import { ApiErrorCode, type AuthenticatedUser } from "@coffee-order/contracts";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Kiem quyen theo cua hang o TANG SERVICE.
 *
 * Dat o service (khong phai guard) de moi loi goi nghiep vu - ke ca internal
 * call giua cac service - deu phai di qua kiem tra nay, khong bypass duoc bang
 * cach khong qua route guard (yeu cau .kiro/steering/05-auth-rbac.md va
 * domain-rules.md).
 *
 * Quy tac:
 *  - ADMIN: toan quyen moi store.
 *  - STAFF: chi store duoc gan trong store_staff.
 *  - CUSTOMER: khong co quyen staff o store nao.
 */
@Injectable()
export class StoreAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** Danh sach store_id ma user duoc gan STAFF. ADMIN tra [] (dung canXxx thay). */
  async staffStoreIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.storeStaff.findMany({
      where: { userId },
      select: { storeId: true },
    });
    return rows.map((r) => r.storeId);
  }

  /** true neu user duoc phep thao tac nghiep vu staff tren store nay. */
  async canActForStore(user: AuthenticatedUser, storeId: string): Promise<boolean> {
    if (user.role === "ADMIN") return true;
    if (user.role !== "STAFF") return false;
    const assignment = await this.prisma.storeStaff.findUnique({
      where: { storeId_userId: { storeId, userId: user.id } },
      select: { storeId: true },
    });
    return assignment !== null;
  }

  /**
   * Nem 403 neu user khong duoc thao tac store nay.
   * Dung o dau moi service xu ly don/thu tien theo store.
   */
  async assertCanActForStore(user: AuthenticatedUser, storeId: string): Promise<void> {
    if (!(await this.canActForStore(user, storeId))) {
      // Khong tiet lo thong tin store; chi bao khong du quyen.
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: "Khong du quyen voi cua hang nay.",
      });
    }
  }
}
