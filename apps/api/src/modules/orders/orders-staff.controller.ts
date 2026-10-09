import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type {
  AuthenticatedUser,
  OrderListItemDto,
  OrderResponse,
  Paginated,
} from "@coffee-order/contracts";
import type { Response } from "express";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import { CollectPaymentDto, StaffOrderListQueryDto, TransitionDto } from "./dto/tracking.dto";
import { OrderTrackingService } from "./order-tracking.service";

/**
 * Xu ly don phia quay (REQ-400..407). STAFF chi thao tac store duoc gan;
 * ADMIN toan quyen. Quyen theo store kiem o service, khong chi o guard.
 *
 * Khong co endpoint PATCH tuy y field cua don: moi thay doi trang thai di qua
 * /transitions, moi thay doi thanh toan di qua /payments.
 */
@ApiTags("staff-orders")
@ApiBearerAuth("supabase-access-token")
@Roles("STAFF", "ADMIN")
@Controller("staff/orders")
export class OrdersStaffController {
  constructor(private readonly tracking: OrderTrackingService) {}

  /**
   * Bang don theo store duoc gan (REQ-400).
   * Scope do server quyet dinh; `storeId` tu client chi loc TRONG scope do.
   */
  @Get()
  @ApiOperation({ summary: "Danh sach don trong pham vi cua hang duoc gan" })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: StaffOrderListQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Paginated<OrderListItemDto>> {
    res.setHeader("Cache-Control", "no-store, private");
    return this.tracking.listStaffOrders(user, query);
  }

  /** Chuyen trang thai don voi CAS theo expectedVersion (REQ-401..404, REQ-407). */
  @Post(":id/transitions")
  @HttpCode(200)
  @ApiOperation({ summary: "Chuyen trang thai don (CAS theo expectedVersion)" })
  @ApiResponse({ status: 200, description: "Chuyen thanh cong" })
  @ApiResponse({ status: 400, description: "Thieu ly do khi tu choi" })
  @ApiResponse({ status: 409, description: "INVALID_TRANSITION / VERSION_CONFLICT" })
  async transition(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: TransitionDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OrderResponse> {
    res.setHeader("Cache-Control", "no-store, private");
    return this.tracking.transition(user, id, dto);
  }

  /** Thu tien tai quay: chi READY + PAY_AT_COUNTER + UNPAID (REQ-405, REQ-406). */
  @Post(":id/payments")
  @HttpCode(200)
  @ApiOperation({ summary: "Thu tien tai quay (CAS theo expectedPaymentVersion)" })
  @ApiResponse({ status: 200, description: "Da ghi nhan thu tien" })
  @ApiResponse({ status: 409, description: "INVALID_TRANSITION / VERSION_CONFLICT" })
  async collectPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CollectPaymentDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OrderResponse> {
    res.setHeader("Cache-Control", "no-store, private");
    return this.tracking.collectPayment(user, id, dto);
  }
}
