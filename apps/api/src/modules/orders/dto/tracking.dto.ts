import { PAGINATION, REASON_MAX_LENGTH } from "@coffee-order/contracts";
import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const ALL_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
] as const;

/** Query phan trang dung chung cho danh sach don. */
export class OrderListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = PAGINATION.defaultPage;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.maxLimit)
  limit: number = PAGINATION.defaultLimit;

  /** Loc theo trang thai. Bo trong = tat ca. */
  @IsOptional()
  @IsIn(ALL_STATUSES)
  status?: (typeof ALL_STATUSES)[number];
}

/**
 * Query cho bang don cua staff.
 *
 * storeId CHI la bo loc trong pham vi ma server da xac dinh; server KHONG tin
 * storeId tu client de mo rong quyen (scope tinh tu store_staff / role ADMIN).
 */
export class StaffOrderListQueryDto extends OrderListQueryDto {
  @IsOptional()
  @IsUUID()
  storeId?: string;
}

/** Chuyen trang thai (staff/admin). */
export class TransitionDto {
  // Khong cho PLACED lam dich: PLACED chi do tao don sinh ra.
  @IsIn(["CONFIRMED", "PREPARING", "READY", "COMPLETED", "REJECTED"])
  toStatus!: "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "REJECTED";

  @IsInt()
  @Min(0)
  expectedVersion!: number;

  @IsOptional()
  @IsString()
  @MaxLength(REASON_MAX_LENGTH)
  reason?: string | null;
}

/** Huy don (chu don). */
export class CancelOrderDto {
  @IsInt()
  @Min(0)
  expectedVersion!: number;

  @IsOptional()
  @IsString()
  @MaxLength(REASON_MAX_LENGTH)
  reason?: string | null;
}

/** Thu tien tai quay. Dung version cua PAYMENT. */
export class CollectPaymentDto {
  @IsInt()
  @Min(0)
  expectedPaymentVersion!: number;
}
