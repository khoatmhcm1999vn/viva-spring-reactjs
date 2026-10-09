import { Module } from "@nestjs/common";
import { CheckoutModule } from "../checkout/checkout.module";
import { OrderTrackingService } from "./order-tracking.service";
import { OrdersController } from "./orders.controller";
import { OrdersStaffController } from "./orders-staff.controller";
import { OrdersService } from "./orders.service";

/**
 * Tao don (bước 08) + xu ly don/tracking (bước 09).
 * Import CheckoutModule de dung lai QuotePricingService khi tao don.
 */
@Module({
  imports: [CheckoutModule],
  controllers: [OrdersController, OrdersStaffController],
  providers: [OrdersService, OrderTrackingService],
  exports: [OrdersService, OrderTrackingService],
})
export class OrdersModule {}
