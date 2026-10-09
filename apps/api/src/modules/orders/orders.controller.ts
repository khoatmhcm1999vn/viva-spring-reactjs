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
  Res,
} from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ApiErrorCode, type AuthenticatedUser, type OrderResponse } from "@coffee-order/contracts";
import type { Response } from "express";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@ApiBearerAuth("supabase-access-token")
@Roles("CUSTOMER")
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /**
   * Tao don. BAT BUOC header Idempolency-Key (REQ-301).
   *
   * 201 khi tao moi; **200** khi replay dung key + dung noi dung (tra lai don cu).
   * Response header `Cache-Control: no-store` vi chua PII nguoi nhan.
   */
  @Post("orders")
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
    res.setHeader("Cache-Control", "no-store");
    // Replay tra 200 de client phan biet voi lan tao dau tien (docs/api-contract.md).
    res.status(replay ? 200 : 201);
    return order;
  }

  /** Chi tiet don cua chinh chu don (REQ-501, REQ-502). */
  @Get("orders/:id")
  @ApiOperation({ summary: "Chi tiet don cua chinh minh" })
  @ApiResponse({ status: 404, description: "Khong tim thay (ke ca khi don thuoc nguoi khac)" })
  async getOwn(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OrderResponse> {
    res.setHeader("Cache-Control", "no-store");
    return this.orders.getOrderForOwner(user, id);
  }
}
