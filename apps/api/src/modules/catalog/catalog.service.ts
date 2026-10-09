import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiErrorCode,
  PAGINATION,
  type AuthenticatedUser,
  type CategoryDto,
  type ModifierGroupDto,
  type Paginated,
  type ProductDetailDto,
  type ProductListItemDto,
  type VariantDto,
} from "@coffee-order/contracts";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { StoreAccessService } from "../auth/store-access.service";
import type { ProductQueryDto } from "./dto/query.dto";
import type {
  CreateCategoryDto,
  CreateModifierOptionDto,
  CreateModifierGroupDto,
  CreateProductDto,
  CreateVariantDto,
  UpdateCategoryDto,
  UpdateModifierOptionDto,
  UpdateModifierGroupDto,
  UpdateProductDto,
  UpdateVariantDto,
} from "./dto/admin.dto";

// slug/SKU trung, max<min la loi dau vao cua client -> 400 VALIDATION_ERROR.
// 409 trong du an danh cho xung dot trang thai/dong thoi (VERSION_CONFLICT...).
function invalid(message: string): BadRequestException {
  return new BadRequestException({ code: ApiErrorCode.VALIDATION_ERROR, message });
}
function notFound(message: string): NotFoundException {
  return new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message });
}

// Loi unique cua Prisma.
function isUniqueViolation(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

/**
 * Hinh dang row product dung cho toListItem. storeVariants chi co khi truy van
 * kem storeId (productInclude thêm include co dieu kien), nen de optional.
 */
interface VariantRow {
  id: string;
  sku: string;
  size: string;
  priceVnd: number;
  isActive: boolean;
  storeVariants?: { isAvailable: boolean }[];
}
interface ProductRow {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  imagePath: string | null;
  isActive: boolean;
  variants: VariantRow[];
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAccess: StoreAccessService,
  ) {}

  /* ======================= DOC CONG KHAI ========================== */

  async listCategories(includeInactive: boolean): Promise<CategoryDto[]> {
    const rows = await this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    }));
  }

  /**
   * Danh sach mon cong khai. Chi tra category/product/variant dang hoat dong.
   * Khi co storeId: tinh `available` theo store_variants va chi coi variant kha
   * dung khi vua isActive vua is_available tai store do.
   */
  async listProducts(query: ProductQueryDto): Promise<Paginated<ProductListItemDto>> {
    const page = query.page ?? PAGINATION.defaultPage;
    const limit = Math.min(query.limit ?? PAGINATION.defaultLimit, PAGINATION.maxLimit);

    if (query.storeId) await this.assertStoreActive(query.storeId);
    if (query.categoryId) {
      const cat = await this.prisma.category.findUnique({ where: { id: query.categoryId } });
      if (!cat) throw notFound("Khong tim thay danh muc.");
    }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      category: { isActive: true },
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: [{ name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: this.productInclude(query.storeId),
      }),
    ]);

    return {
      items: rows.map((p) => this.toListItem(p, query.storeId)),
      page,
      limit,
      total,
    };
  }

  async getProductDetail(id: string, storeId?: string): Promise<ProductDetailDto> {
    if (storeId) await this.assertStoreActive(storeId);

    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true, category: { isActive: true } },
      include: {
        ...this.productInclude(storeId),
        modifierGroups: {
          include: { group: { include: { options: { where: { isActive: true } } } } },
        },
      },
    });
    if (!product) throw notFound("Khong tim thay mon.");

    const base = this.toListItem(product, storeId);
    const modifierGroups: ModifierGroupDto[] = product.modifierGroups.map((pg) => ({
      id: pg.group.id,
      name: pg.group.name,
      minSelect: pg.group.minSelect,
      maxSelect: pg.group.maxSelect,
      options: pg.group.options.map((o) => ({
        id: o.id,
        name: o.name,
        extraPriceVnd: o.extraPriceVnd,
        isActive: o.isActive,
      })),
    }));

    return { ...base, modifierGroups };
  }

  private productInclude(storeId?: string): Prisma.ProductInclude {
    return {
      variants: {
        where: { isActive: true },
        orderBy: { priceVnd: "asc" },
        ...(storeId ? { include: { storeVariants: { where: { storeId } } } } : {}),
      },
    };
  }

  private toListItem(product: ProductRow, storeId?: string): ProductListItemDto {
    const variants: VariantDto[] = product.variants.map((v) => {
      // Khi loc theo store: available = co ban trong store_variants cua store do.
      // Chua co ban ghi store_variant -> coi nhu khong ban tai store (false).
      const available = storeId
        ? (v.storeVariants?.[0]?.isAvailable ?? false)
        : null;
      return {
        id: v.id,
        sku: v.sku,
        size: v.size,
        priceVnd: v.priceVnd,
        isActive: v.isActive,
        available,
      };
    });

    // fromPrice: variant re nhat con ban. Khi loc store, chi tinh variant available.
    const sellable = storeId ? variants.filter((v) => v.available) : variants;
    const fromPriceVnd =
      sellable.length > 0 ? Math.min(...sellable.map((v) => v.priceVnd)) : null;

    return {
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      imagePath: product.imagePath,
      isActive: product.isActive,
      variants,
      fromPriceVnd,
    };
  }

  private async assertStoreActive(storeId: string): Promise<void> {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw notFound("Khong tim thay cua hang.");
    if (!store.isActive) {
      throw new HttpException(
        { code: ApiErrorCode.ITEM_UNAVAILABLE, message: "Cua hang dang tam dong." },
        HttpStatus.CONFLICT,
      );
    }
  }

  /* ========================= ADMIN: category ====================== */

  async createCategory(dto: CreateCategoryDto): Promise<CategoryDto> {
    try {
      const c = await this.prisma.category.create({
        data: { name: dto.name, slug: dto.slug, sortOrder: dto.sortOrder ?? 0 },
      });
      return this.categoryDto(c);
    } catch (err) {
      if (isUniqueViolation(err)) throw invalid("Slug danh muc da ton tai.");
      throw err;
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<CategoryDto> {
    await this.mustFindCategory(id);
    try {
      const c = await this.prisma.category.update({ where: { id }, data: dto });
      return this.categoryDto(c);
    } catch (err) {
      if (isUniqueViolation(err)) throw invalid("Slug danh muc da ton tai.");
      throw err;
    }
  }

  /* ========================= ADMIN: product ======================= */

  async createProduct(dto: CreateProductDto): Promise<ProductDetailDto> {
    await this.mustFindCategory(dto.categoryId);
    try {
      const p = await this.prisma.product.create({
        data: {
          categoryId: dto.categoryId,
          name: dto.name,
          slug: dto.slug,
          description: dto.description ?? null,
          imagePath: dto.imagePath ?? null,
        },
      });
      return this.getProductDetailAdmin(p.id);
    } catch (err) {
      if (isUniqueViolation(err)) throw invalid("Slug mon da ton tai.");
      throw err;
    }
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<ProductDetailDto> {
    await this.mustFindProduct(id);
    if (dto.categoryId) await this.mustFindCategory(dto.categoryId);
    try {
      await this.prisma.product.update({ where: { id }, data: dto });
      return this.getProductDetailAdmin(id);
    } catch (err) {
      if (isUniqueViolation(err)) throw invalid("Slug mon da ton tai.");
      throw err;
    }
  }

  /* ========================= ADMIN: variant ======================= */

  async createVariant(productId: string, dto: CreateVariantDto): Promise<ProductDetailDto> {
    await this.mustFindProduct(productId);
    try {
      await this.prisma.productVariant.create({
        data: { productId, sku: dto.sku, size: dto.size, priceVnd: dto.priceVnd },
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        // Co the trung sku hoac trung (product, size).
        throw invalid("SKU hoac size cua mon nay da ton tai.");
      }
      throw err;
    }
    return this.getProductDetailAdmin(productId);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ): Promise<ProductDetailDto> {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant || variant.productId !== productId) throw notFound("Khong tim thay variant.");
    try {
      await this.prisma.productVariant.update({ where: { id: variantId }, data: dto });
    } catch (err) {
      if (isUniqueViolation(err)) throw invalid("SKU hoac size cua mon nay da ton tai.");
      throw err;
    }
    return this.getProductDetailAdmin(productId);
  }

  /* ==================== ADMIN: modifier group ===================== */

  async createModifierGroup(dto: CreateModifierGroupDto) {
    if (dto.maxSelect < dto.minSelect) {
      throw invalid("maxSelect phai >= minSelect.");
    }
    const g = await this.prisma.modifierGroup.create({
      data: { name: dto.name, minSelect: dto.minSelect, maxSelect: dto.maxSelect },
    });
    return g;
  }

  async updateModifierGroup(id: string, dto: UpdateModifierGroupDto) {
    const existing = await this.prisma.modifierGroup.findUnique({ where: { id } });
    if (!existing) throw notFound("Khong tim thay nhom modifier.");
    const min = dto.minSelect ?? existing.minSelect;
    const max = dto.maxSelect ?? existing.maxSelect;
    if (max < min) throw invalid("maxSelect phai >= minSelect.");
    return this.prisma.modifierGroup.update({ where: { id }, data: dto });
  }

  async createModifierOption(groupId: string, dto: CreateModifierOptionDto) {
    const group = await this.prisma.modifierGroup.findUnique({ where: { id: groupId } });
    if (!group) throw notFound("Khong tim thay nhom modifier.");
    try {
      return await this.prisma.modifierOption.create({
        data: { groupId, name: dto.name, extraPriceVnd: dto.extraPriceVnd },
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw invalid("Ten tuy chon da ton tai trong nhom.");
      throw err;
    }
  }

  async updateModifierOption(groupId: string, optionId: string, dto: UpdateModifierOptionDto) {
    const option = await this.prisma.modifierOption.findUnique({ where: { id: optionId } });
    if (!option || option.groupId !== groupId) throw notFound("Khong tim thay tuy chon.");
    try {
      return await this.prisma.modifierOption.update({ where: { id: optionId }, data: dto });
    } catch (err) {
      if (isUniqueViolation(err)) throw invalid("Ten tuy chon da ton tai trong nhom.");
      throw err;
    }
  }

  /**
   * Thay the toan bo tap nhom modifier gan cho product (PUT).
   * Kiem moi groupId ton tai truoc; chay trong transaction de nhat quan.
   */
  async setProductModifierGroups(
    productId: string,
    groupIds: string[],
  ): Promise<ProductDetailDto> {
    await this.mustFindProduct(productId);

    if (groupIds.length > 0) {
      const found = await this.prisma.modifierGroup.findMany({
        where: { id: { in: groupIds } },
        select: { id: true },
      });
      if (found.length !== groupIds.length) {
        throw notFound("Mot hoac nhieu nhom modifier khong ton tai.");
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.productModifierGroup.deleteMany({ where: { productId } });
      if (groupIds.length > 0) {
        await tx.productModifierGroup.createMany({
          data: groupIds.map((groupId) => ({ productId, groupId })),
        });
      }
    });

    return this.getProductDetailAdmin(productId);
  }

  /* ================ STAFF: toggle availability ==================== */

  /**
   * Bat/tat ban mot variant tai mot store. Chi doi store_variants.is_available,
   * khong doi gia/catalog. Kiem quyen store o SERVICE (khong chi guard).
   */
  async setVariantAvailability(
    user: AuthenticatedUser,
    storeId: string,
    variantId: string,
    isAvailable: boolean,
  ): Promise<{ storeId: string; variantId: string; isAvailable: boolean }> {
    await this.storeAccess.assertCanActForStore(user, storeId);

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw notFound("Khong tim thay cua hang.");
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw notFound("Khong tim thay variant.");

    const row = await this.prisma.storeVariant.upsert({
      where: { storeId_variantId: { storeId, variantId } },
      update: { isAvailable },
      create: { storeId, variantId, isAvailable },
    });
    return { storeId: row.storeId, variantId: row.variantId, isAvailable: row.isAvailable };
  }

  /* ============================ helpers =========================== */

  private categoryDto(c: {
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
    isActive: boolean;
  }): CategoryDto {
    return { id: c.id, name: c.name, slug: c.slug, sortOrder: c.sortOrder, isActive: c.isActive };
  }

  private async mustFindCategory(id: string): Promise<void> {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw notFound("Khong tim thay danh muc.");
  }

  private async mustFindProduct(id: string): Promise<void> {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw notFound("Khong tim thay mon.");
  }

  /** Chi tiet mon cho admin: khong loc isActive, khong loc theo store. */
  private async getProductDetailAdmin(id: string): Promise<ProductDetailDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { priceVnd: "asc" } },
        modifierGroups: {
          include: { group: { include: { options: true } } },
        },
      },
    });
    if (!product) throw notFound("Khong tim thay mon.");

    const variants: VariantDto[] = product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      priceVnd: v.priceVnd,
      isActive: v.isActive,
      available: null,
    }));
    const sellable = variants;
    const fromPriceVnd =
      sellable.length > 0 ? Math.min(...sellable.map((v) => v.priceVnd)) : null;

    return {
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      imagePath: product.imagePath,
      isActive: product.isActive,
      variants,
      fromPriceVnd,
      modifierGroups: product.modifierGroups.map((pg) => ({
        id: pg.group.id,
        name: pg.group.name,
        minSelect: pg.group.minSelect,
        maxSelect: pg.group.maxSelect,
        options: pg.group.options.map((o) => ({
          id: o.id,
          name: o.name,
          extraPriceVnd: o.extraPriceVnd,
          isActive: o.isActive,
        })),
      })),
    };
  }
}
