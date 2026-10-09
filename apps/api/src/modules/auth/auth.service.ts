import { ForbiddenException, Injectable } from "@nestjs/common";
import { ApiErrorCode, type AuthenticatedUser } from "@coffee-order/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import type { VerifiedToken } from "./token-verifier.service";

/**
 * Map Supabase user (sau khi token da duoc xac minh) sang profile trong DB.
 *
 * Nguyen tac:
 *  - Provision an toan: lan dau thay sub chua co profile -> tao profile role
 *    CUSTOMER. Role KHONG BAO GIO lay tu token/metadata (REQ-001, REQ-003).
 *  - upsert theo id (= sub) nen chay dong thoi khong tao trung.
 *  - Doc role hien tai tu DB moi lan -> admin doi role co hieu luc ngay.
 */
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveUser(token: VerifiedToken): Promise<AuthenticatedUser> {
    const profile = await this.prisma.profile.upsert({
      where: { id: token.sub },
      update: {},
      // Chi dat role mac dinh khi TAO moi; update rong de khong ghi de role da co.
      create: { id: token.sub, role: "CUSTOMER", isActive: true },
      select: { id: true, role: true, isActive: true },
    });

    if (!profile.isActive) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: "Tai khoan da bi vo hieu hoa.",
      });
    }

    return {
      id: profile.id,
      role: profile.role,
      isActive: profile.isActive,
      email: token.email,
    };
  }
}
