import { PAGINATION } from "@coffee-order/contracts";
import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

/**
 * Query cho GET /v1/products.
 *
 * ValidationPipe dung enableImplicitConversion=false nen page/limit phai co
 * @Type(() => Number) de ep tu query string sang so.
 */
export class ProductQueryDto {
  /** Loc theo store: anh huong co `available` va `fromPriceVnd`. */
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /** Tim theo ten mon (chua chuan hoa dau). */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

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
}

/** Query cho GET /v1/products/:id (chi can storeId tuy chon). */
export class ProductDetailQueryDto {
  @IsOptional()
  @IsUUID()
  storeId?: string;
}

/** Query cho GET /v1/categories. */
export class CategoryQueryDto {
  /** true (mac dinh) chi tra category dang hoat dong; admin co the xem ca an. */
  @IsOptional()
  @Type(() => Boolean)
  includeInactive?: boolean;
}
