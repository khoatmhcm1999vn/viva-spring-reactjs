import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  ApiErrorCode,
  type AuthenticatedUser,
  type OrderHistoryEntryDto,
  type OrderListItemDto,
  type OrderResponse,
  type Paginated,
} from "@coffee-order/contracts";
import type { Response } from "express";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import { CreateOrderDto } from "./dto/create-order.dto";
import { CancelOrderDto, OrderListQueryDto } from "./dto/tracking.dto";
import { OrderTrackingService } from "./order-tracking.service";
import { OrdersService } from "./orders.service";

/** Chi tiet/list don chua PII nguoi nhan -> khong cache o proxy/browser. */
function noStore(res: Response): void {
  res.setHeader("Cache-Control", "no-store, private");
}

@ApiTags("orders")
@ApiBearerAuth("supabase-access-token")
@Controller()
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly tracking: OrderTrackingService,
  ) {}

  /**
   * Tao don. BAT BUOC header Idempotency-Key (REQ-301).
   * 201 khi tao moi; 200 khi replay dung key + dung noi dung.
   */
  @Post("orders")
  @Roles("CUSTOMER")
  @HttpCode(201)
  @ApiHeader({
    name: "Idempotency-Key",
    required: true,
    description: "UUID do client sinh; retry phai dung lai dung key nay.",
  })
  @ApiOperation({ summary: "Tao don tu quote da bao gia" })
  @ApiResponse({ status: 201, description: "Tao don thanh cong" })
  @ApiResponse({ status: 200, description: "Replay cua request da thanh cong" })
  @ApiResponse({ status: 409, description: "PRICE_CHANGED / ITEM_UNAVAILABLE / IDEMPOTENCY_CONFLICT / QUOTE_ALREADY_USED" })
  @ApiResponse({ status: 410, description: "QUOTE_EXPIRED" })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() dto: CreateOrderDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OrderResponse> {
    const key = idempotencyKey?.trim();
    if (!key) {
      throw new BadRequestException({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: "Thieu header Idempotency-Key.",
      });
    }
    if (key.length > 200) {
      throw new BadRequestException({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: "Idempotency-Key qua dai.",
      });
    }

    const { order, replay } = await this.orders.createOrder(user, key, dto);
    noStore(res);
    res.status(replay ? 200 : 201);
    return order;
  }

  /** Lich su don cua chinh minh (REQ-500). */
  @Get("me/orders")
  @Roles("CUSTOMER")
  @ApiOperation({ summary: "Danh sach don cua chinh minh, co phan trang" })
  async listOwn(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrderListQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Paginated<OrderListItemDto>> {
    noStore(res);
    return this.tracking.listOwnOrders(user, query);
  }

  /**
   * Chi tiet don: chu don, staff duoc gan store, hoac admin (REQ-501, REQ-502).
   * Nguoi khac -> 404, khong tiet lo ton tai va khong tra PII.
   */
  @Get("orders/:id")
  @ApiOperation({ summary: "Chi tiet don" })
  @ApiResponse({ status: 404, description: "Khong tim thay / khong du quyen" })
  async getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OrderResponse> {
    noStore(res);
    return this.tracking.getOrder(user, id);
  }

  /** Timeline don. actorName chi tra cho staff/admin. */
  @Get("orders/:id/history")
  @ApiOperation({ summary: "Timeline chuyen trang thai cua don" })
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OrderHistoryEntryDto[]> {
    noStore(res);
    return this.tracking.getHistory(user, id);
  }

  /** Chu don huy don khi con PLACED (REQ-504). */
  @Post("orders/:id/cancel")
  @Roles("CUSTOMER")
  @HttpCode(200)
  @ApiOperation({ summary: "Chu don huy don (chi khi con PLACED)" })
  @ApiResponse({ status: 409, description: "INVALID_TRANSITION / VERSION_CONFLICT" })
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CancelOrderDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OrderResponse> {
    noStore(res);
    return this.tracking.cancel(user, id, dto);
  }
}
