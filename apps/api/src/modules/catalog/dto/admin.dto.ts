import { MAX_SIGNED_INT32 } from "@coffee-order/contracts";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

// slug: chu thuong, so, dau gach ngang; dung chung cho category + product.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MSG = "slug chi gom chu thuong, so va dau gach ngang.";

/* ----------------------------- Category ----------------------------- */
export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(SLUG_RE, { message: SLUG_MSG })
  @MaxLength(100)
  slug!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(SLUG_RE, { message: SLUG_MSG })
  @MaxLength(100)
  slug?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/* ----------------------------- Product ------------------------------ */
export class CreateProductDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @IsString()
  @Matches(SLUG_RE, { message: SLUG_MSG })
  @MaxLength(150)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  imagePath?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(SLUG_RE, { message: SLUG_MSG })
  @MaxLength(150)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  imagePath?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/* ----------------------------- Variant ------------------------------ */
export class CreateVariantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  sku!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  size!: string;

  // Tien la integer VND >= 0, chan tran integer PostgreSQL.
  @IsInt()
  @Min(0)
  @Max(MAX_SIGNED_INT32)
  priceVnd!: number;
}

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  sku?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  size?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_SIGNED_INT32)
  priceVnd?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/* -------------------------- Modifier group -------------------------- */
export class CreateModifierGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsInt()
  @Min(0)
  minSelect!: number;

  @IsInt()
  @Min(1)
  maxSelect!: number;
}

export class UpdateModifierGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSelect?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelect?: number;
}

/* -------------------------- Modifier option ------------------------- */
export class CreateModifierOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsInt()
  @Min(0)
  @Max(MAX_SIGNED_INT32)
  extraPriceVnd!: number;
}

export class UpdateModifierOptionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_SIGNED_INT32)
  extraPriceVnd?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/* ----------------- Gan nhom modifier cho product -------------------- */
export class SetProductModifierGroupsDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  groupIds!: string[];
}

/* ------------- Staff: bat/tat availability variant tai store -------- */
export class SetVariantAvailabilityDto {
  @IsBoolean()
  isAvailable!: boolean;
}
