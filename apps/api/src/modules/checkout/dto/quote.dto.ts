import { CART_LIMITS, NOTE_MAX_LENGTH } from "@coffee-order/contracts";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class RecipientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  // SDT VN: 9-15 chu so, cho phep dau + o dau. Du cho MVP, chua ep dau so VN.
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/, { message: "So dien thoai khong hop le." })
  phone!: string;
}

export class QuoteItemDto {
  @IsUUID()
  variantId!: string;

  @IsInt()
  @Min(CART_LIMITS.minQuantityPerLine)
  @Max(CART_LIMITS.maxQuantityPerLine)
  quantity!: number;

  // Moi option quantity = 1 o MVP; khong trung trong cung dong.
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  modifierOptionIds!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(NOTE_MAX_LENGTH)
  note?: string | null;
}

export class QuoteRequestDto {
  @IsUUID()
  storeId!: string;

  // MVP chi PICKUP + PAY_AT_COUNTER; chan gia tri khac ngay o DTO.
  @IsIn(["PICKUP"])
  fulfillmentType!: "PICKUP";

  @IsIn(["PAY_AT_COUNTER"])
  paymentMethod!: "PAY_AT_COUNTER";

  @ValidateNested()
  @Type(() => RecipientDto)
  recipient!: RecipientDto;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(CART_LIMITS.maxLines)
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items!: QuoteItemDto[];
}
