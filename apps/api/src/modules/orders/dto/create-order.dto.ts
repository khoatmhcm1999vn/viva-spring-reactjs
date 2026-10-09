import { IsUUID } from "class-validator";
import { QuoteRequestDto } from "../../checkout/dto/quote.dto";

/**
 * Body cua POST /v1/orders: quoteId + DUNG cart payload da dung de bao gia.
 *
 * Ke thua QuoteRequestDto nen moi rang buoc o bước 07 (PICKUP, PAY_AT_COUNTER,
 * quantity 1..20, <=50 dong, note <=200, option UUID khong trung) duoc ap lai.
 * Client KHONG gui gia; gia lay tu quote + tinh lai o server.
 */
export class CreateOrderDto extends QuoteRequestDto {
  @IsUUID()
  quoteId!: string;
}
