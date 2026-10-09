import { Module } from "@nestjs/common";
import { CheckoutModule } from "../checkout/checkout.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

/**
 * Tao don. Import CheckoutModule de dung lai QuotePricingService - cung logic
 * tinh gia voi bước 07, nhung chay trong transaction tao don.
 */
@Module({
  imports: [CheckoutModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
