import { Injectable, NotFoundException } from "@nestjs/common";
import { ApiErrorCode, type AuthenticatedUser, type MeResponse } from "@coffee-order/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { StoreAccessService } from "../auth/store-access.service";

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAccess: StoreAccessService,
  ) {}

  async getProfile(user: AuthenticatedUser): Promise<MeResponse> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, fullName: true, phone: true, isActive: true },
    });
    if (!profile) {
      // Khong nen xay ra: AuthGuard da provision profile truoc do.
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: "Khong tim thay ho so.",
      });
    }

    const staffStoreIds =
      profile.role === "STAFF" ? await this.storeAccess.staffStoreIds(profile.id) : [];

    return {
      id: profile.id,
      role: profile.role,
      fullName: profile.fullName,
      phone: profile.phone,
      isActive: profile.isActive,
      staffStoreIds,
    };
  }
}
