import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser, MeResponse } from "@coffee-order/contracts";
import { CurrentUser } from "../auth/auth.decorators";
import { MeService } from "./me.service";

@ApiTags("me")
@ApiBearerAuth("supabase-access-token")
@Controller("me")
export class MeController {
  constructor(private readonly meService: MeService) {}

  /**
   * Ho so cua chinh nguoi dung dang dang nhap.
   * role LUON lay tu DB (profiles.role), khong tu token. Khong tra token/secret.
   */
  @Get()
  @ApiOperation({ summary: "Ho so cua nguoi dung dang xac thuc" })
  @ApiResponse({ status: 200, description: "Ho so hien tai" })
  @ApiResponse({ status: 401, description: "Chua xac thuc" })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<MeResponse> {
    return this.meService.getProfile(user);
  }
}
