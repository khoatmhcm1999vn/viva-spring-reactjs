import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import {
  ApiErrorCode,
  normalizeNote,
  type QuoteLine,
  type QuoteLineModifier,
  type QuoteRequest,
} from "@coffee-order/contracts";
import type { PrismaService } from "../../prisma/prisma.service";

/** Ket qua tinh gia: cac dong + subtotal, da validate theo domain. */
export interface PricedQuote {
  lines: QuoteLine[];
  subtotalVnd: number;
}

type Tx = Pick<
  PrismaService,
  "store" | "productVariant" | "storeVariant" | "productModifierGroup" | "modifierOption"
>;

function validation(message: string): BadRequestException {
  return new BadRequestException({ code: ApiErrorCode.VALIDATION_ERROR, message });
}
function itemUnavailable(message: string): HttpException {
  // 409 ITEM_UNAVAILABLE: mon/variant/store khong con ban (phan biet voi 400 nhap sai).
  return new HttpException(
    { code: ApiErrorCode.ITEM_UNAVAILABLE, message },
    HttpStatus.CONFLICT,
  );
}

/**
 * Tinh gia bao gia tu CATALOG trong DB (REQ-200/201/203).
 *
 * Dung tren mot transaction client de bước 08 goi lai cung logic trong
 * transaction tao don (khoa cac dong catalog theo thu tu ID co dinh). Khong tin
 * bat ky gia nao tu client.
 *
 * Kiem day du: store hoat dong, variant thuoc store + con ban (availability),
 * modifier thuoc dung product, so option trong [min,max] moi nhom, option khong
 * trung, option con active. line_total = unit_price * quantity.
 */
@Injectable()
export class QuotePricingService {
  async priceQuote(tx: Tx, req: QuoteRequest): Promise<PricedQuote> {
    // 1. Store phai ton tai va hoat dong.
    const store = await tx.store.findUnique({ where: { id: req.storeId } });
    if (!store) throw validation("Cua hang khong ton tai.");
    if (!store.isActive) throw itemUnavailable("Cua hang dang tam dong.");

    const lines: QuoteLine[] = [];

    for (const item of req.items) {
      // 2. Variant: ton tai, con active, thuoc mot product active.
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });
      if (!variant || !variant.isActive || !variant.product.isActive) {
        throw itemUnavailable("Mon khong con ban.");
      }

      // 3. Availability tai store: phai co store_variant va is_available = true.
      const sv = await tx.storeVariant.findUnique({
        where: { storeId_variantId: { storeId: req.storeId, variantId: item.variantId } },
      });
      if (!sv || !sv.isAvailable) {
        throw itemUnavailable(`Mon "${variant.product.name}" (${variant.size}) khong con ban.`);
      }

      // 4. Modifier: lay cac nhom gan cho product + option hop le.
      const modifiers = await this.priceModifiers(tx, variant.productId, item.modifierOptionIds);

      const extraSum = modifiers.reduce((s, m) => s + m.extraPriceVnd, 0);
      const unitPriceVnd = variant.priceVnd + extraSum;
      const lineTotalVnd = unitPriceVnd * item.quantity;

      lines.push({
        variantId: variant.id,
        productName: variant.product.name,
        size: variant.size,
        basePriceVnd: variant.priceVnd,
        unitPriceVnd,
        quantity: item.quantity,
        lineTotalVnd,
        modifiers,
        note: normalizeNote(item.note),
      });
    }

    const subtotalVnd = lines.reduce((s, l) => s + l.lineTotalVnd, 0);
    return { lines, subtotalVnd };
  }

  /**
   * Validate + dinh gia cac modifier option cua mot dong.
   * - Moi option phai thuoc mot nhom DA GAN cho product.
   * - Option phai active.
   * - So option chon moi nhom nam trong [minSelect, maxSelect].
   * - Khong trung option (DTO da chan, kiem lai o day cho chac).
   */
  private async priceModifiers(
    tx: Tx,
    productId: string,
    optionIds: string[],
  ): Promise<QuoteLineModifier[]> {
    // Tap nhom gan cho product.
    const productGroups = await tx.productModifierGroup.findMany({
      where: { productId },
      include: { group: { include: { options: true } } },
    });

    const groupById = new Map(productGroups.map((pg) => [pg.group.id, pg.group]));
    // option id -> group (chi trong cac nhom gan cho product).
    const optionToGroup = new Map<string, { groupId: string; name: string }>();
    for (const pg of productGroups) {
      for (const opt of pg.group.options) {
        optionToGroup.set(opt.id, { groupId: pg.group.id, name: opt.name });
      }
    }

    const uniqueIds = new Set(optionIds);
    if (uniqueIds.size !== optionIds.length) {
      throw validation("Tuy chon bi trung trong mot dong.");
    }

    // Dem so option chon theo nhom + dung gia tu DB.
    const chosen: QuoteLineModifier[] = [];
    const countByGroup = new Map<string, number>();

    for (const optionId of optionIds) {
      const info = optionToGroup.get(optionId);
      if (!info) {
        throw validation("Tuy chon khong thuoc mon nay.");
      }
      const option = await tx.modifierOption.findUnique({ where: { id: optionId } });
      if (!option || !option.isActive) {
        throw itemUnavailable("Tuy chon khong con kha dung.");
      }
      const group = groupById.get(info.groupId)!;
      chosen.push({
        optionId: option.id,
        groupName: group.name,
        optionName: option.name,
        extraPriceVnd: option.extraPriceVnd,
      });
      countByGroup.set(info.groupId, (countByGroup.get(info.groupId) ?? 0) + 1);
    }

    // Kiem min/max cho MOI nhom gan cho product (ke ca nhom bat buoc chua chon).
    for (const pg of productGroups) {
      const count = countByGroup.get(pg.group.id) ?? 0;
      if (count < pg.group.minSelect) {
        throw validation(
          `Nhom "${pg.group.name}" can chon it nhat ${pg.group.minSelect} tuy chon.`,
        );
      }
      if (count > pg.group.maxSelect) {
        throw validation(
          `Nhom "${pg.group.name}" chi duoc chon toi da ${pg.group.maxSelect} tuy chon.`,
        );
      }
    }

    // Thu tu modifier on dinh theo optionId de snapshot/hash nhat quan.
    return chosen.sort((a, b) => (a.optionId < b.optionId ? -1 : a.optionId > b.optionId ? 1 : 0));
  }
}
