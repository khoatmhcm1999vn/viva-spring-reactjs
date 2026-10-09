import { Module } from "@nestjs/common";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";
import { QuotePricingService } from "./quote-pricing.service";

/**
 * Gio hang / bao gia. QuotePricingService duoc export de bước 08 (tao don) dung
 * lai cung logic tinh gia trong transaction tao don.
 */
@Module({
  controllers: [CheckoutController],
  providers: [CheckoutService, QuotePricingService],
  exports: [QuotePricingService, CheckoutService],
})
export class CheckoutModule {}
