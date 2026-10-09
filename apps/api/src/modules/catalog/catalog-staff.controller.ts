import { Body, Controller, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "@coffee-order/contracts";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import { CatalogService } from "./catalog.service";
import { SetVariantAvailabilityDto } from "./dto/admin.dto";

/**
 * Staff (va admin) bat/tat ban mon tai cua hang (REQ-408).
 * Chi doi availability; quyen store kiem o service (StoreAccessService).
 */
@ApiTags("staff-catalog")
@ApiBearerAuth("supabase-access-token")
@Roles("STAFF", "ADMIN")
@Controller("staff/stores")
export class CatalogStaffController {
  constructor(private readonly catalog: CatalogService) {}

  @Patch(":storeId/variants/:variantId")
  @ApiOperation({ summary: "Bat/tat ban mot variant tai cua hang" })
  setAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
    @Param("variantId", new ParseUUIDPipe()) variantId: string,
    @Body() dto: SetVariantAvailabilityDto,
  ) {
    return this.catalog.setVariantAvailability(user, storeId, variantId, dto.isAvailable);
  }
}
