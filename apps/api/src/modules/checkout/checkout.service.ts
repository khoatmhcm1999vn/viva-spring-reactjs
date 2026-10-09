import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import {
  QUOTE_TTL_SECONDS,
  canonicalizeQuote,
  type AuthenticatedUser,
  type QuoteRequest,
  type QuoteResponse,
} from "@coffee-order/contracts";
import type { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { QuotePricingService } from "./quote-pricing.service";

/**
 * Bao gia va luu quote (REQ-205).
 *
 * - Gia tinh o server tu catalog (QuotePricingService), khong tin client.
 * - Luu checkout_quotes: user/store, request_hash (canonical), price_snapshot,
 *   total, expires_at = now + QUOTE_TTL_SECONDS.
 * - Quote KHONG giu ton kho/availability toi luc dat; bước 08 kiem lai gia +
 *   availability khi tao don va so sanh voi snapshot.
 */
@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: QuotePricingService,
  ) {}

  /** Bam canonical bang SHA-256 (crypto cua Node, khong de trong goi browser-safe). */
  static hashCanonical(req: QuoteRequest): string {
    const canonical = canonicalizeQuote(req);
    return createHash("sha256").update(canonical).digest("hex");
  }

  async createQuote(user: AuthenticatedUser, req: QuoteRequest): Promise<QuoteResponse> {
    const priced = await this.pricing.priceQuote(this.prisma, req);

    const canonical = canonicalizeQuote(req);
    const requestHash = createHash("sha256").update(canonical).digest("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + QUOTE_TTL_SECONDS * 1000);

    const priceSnapshot = {
      lines: priced.lines,
      subtotalVnd: priced.subtotalVnd,
      shippingFeeVnd: 0,
      discountVnd: 0,
      totalVnd: priced.subtotalVnd,
    };

    const quote = await this.prisma.checkoutQuote.create({
      data: {
        userId: user.id,
        storeId: req.storeId,
        requestHash,
        // JSON round-trip de khop kieu Prisma.InputJsonValue (loai undefined).
        normalizedPayload: JSON.parse(canonical) as Prisma.InputJsonValue,
        priceSnapshot: JSON.parse(JSON.stringify(priceSnapshot)) as Prisma.InputJsonValue,
        totalVnd: priced.subtotalVnd,
        expiresAt,
      },
    });

    return {
      quoteId: quote.id,
      expiresAt: expiresAt.toISOString(),
      items: priced.lines,
      subtotalVnd: priced.subtotalVnd,
      shippingFeeVnd: 0,
      discountVnd: 0,
      totalVnd: priced.subtotalVnd,
    };
  }
}
