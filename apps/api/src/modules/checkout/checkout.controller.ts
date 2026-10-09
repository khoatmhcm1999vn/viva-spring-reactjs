import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser, QuoteResponse } from "@coffee-order/contracts";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import { CheckoutService } from "./checkout.service";
import { QuoteRequestDto } from "./dto/quote.dto";

/**
 * Bao gia truoc khi dat don (REQ-205). Chi CUSTOMER.
 * Tra 200 (khong phai 201): quote la tai nguyen tam, khong phai resource ben vung.
 */
@ApiTags("checkout")
@ApiBearerAuth("supabase-access-token")
@Roles("CUSTOMER")
@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post("quote")
  @HttpCode(200)
  @ApiOperation({ summary: "Bao gia gio hang: tinh gia server-side, luu quote co han" })
  @ApiResponse({ status: 200, description: "Bao gia thanh cong" })
  @ApiResponse({ status: 400, description: "Du lieu khong hop le" })
  @ApiResponse({ status: 409, description: "Mon/cua hang khong con ban" })
  createQuote(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: QuoteRequestDto,
  ): Promise<QuoteResponse> {
    return this.checkout.createQuote(user, dto);
  }
}
