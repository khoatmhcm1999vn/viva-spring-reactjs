import { Body, Controller, Param, ParseUUIDPipe, Patch, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { CategoryDto, ProductDetailDto } from "@coffee-order/contracts";
import { Roles } from "../auth/auth.decorators";
import { CatalogService } from "./catalog.service";
import {
  CreateCategoryDto,
  CreateModifierGroupDto,
  CreateModifierOptionDto,
  CreateProductDto,
  CreateVariantDto,
  SetProductModifierGroupsDto,
  UpdateCategoryDto,
  UpdateModifierGroupDto,
  UpdateModifierOptionDto,
  UpdateProductDto,
  UpdateVariantDto,
} from "./dto/admin.dto";

/**
 * Quan tri catalog. Chi ADMIN (REQ-600..603).
 * Khong co endpoint xoa vat ly: dung isActive de an (giu snapshot don cu).
 */
@ApiTags("admin-catalog")
@ApiBearerAuth("supabase-access-token")
@Roles("ADMIN")
@Controller("admin")
export class CatalogAdminController {
  constructor(private readonly catalog: CatalogService) {}

  @Post("categories")
  @ApiOperation({ summary: "Tao danh muc" })
  createCategory(@Body() dto: CreateCategoryDto): Promise<CategoryDto> {
    return this.catalog.createCategory(dto);
  }

  @Patch("categories/:id")
  @ApiOperation({ summary: "Sua / an danh muc" })
  updateCategory(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    return this.catalog.updateCategory(id, dto);
  }

  @Post("products")
  @ApiOperation({ summary: "Tao mon" })
  createProduct(@Body() dto: CreateProductDto): Promise<ProductDetailDto> {
    return this.catalog.createProduct(dto);
  }

  @Patch("products/:id")
  @ApiOperation({ summary: "Sua / an mon" })
  updateProduct(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductDetailDto> {
    return this.catalog.updateProduct(id, dto);
  }

  @Post("products/:productId/variants")
  @ApiOperation({ summary: "Them size cho mon" })
  createVariant(
    @Param("productId", new ParseUUIDPipe()) productId: string,
    @Body() dto: CreateVariantDto,
  ): Promise<ProductDetailDto> {
    return this.catalog.createVariant(productId, dto);
  }

  @Patch("products/:productId/variants/:variantId")
  @ApiOperation({ summary: "Sua / an size" })
  updateVariant(
    @Param("productId", new ParseUUIDPipe()) productId: string,
    @Param("variantId", new ParseUUIDPipe()) variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<ProductDetailDto> {
    return this.catalog.updateVariant(productId, variantId, dto);
  }

  @Put("products/:productId/modifier-groups")
  @ApiOperation({ summary: "Thay the tap nhom modifier gan cho mon" })
  setProductModifierGroups(
    @Param("productId", new ParseUUIDPipe()) productId: string,
    @Body() dto: SetProductModifierGroupsDto,
  ): Promise<ProductDetailDto> {
    return this.catalog.setProductModifierGroups(productId, dto.groupIds);
  }

  @Post("modifier-groups")
  @ApiOperation({ summary: "Tao nhom modifier" })
  createModifierGroup(@Body() dto: CreateModifierGroupDto) {
    return this.catalog.createModifierGroup(dto);
  }

  @Patch("modifier-groups/:id")
  @ApiOperation({ summary: "Sua nhom modifier" })
  updateModifierGroup(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateModifierGroupDto,
  ) {
    return this.catalog.updateModifierGroup(id, dto);
  }

  @Post("modifier-groups/:groupId/options")
  @ApiOperation({ summary: "Them tuy chon vao nhom modifier" })
  createModifierOption(
    @Param("groupId", new ParseUUIDPipe()) groupId: string,
    @Body() dto: CreateModifierOptionDto,
  ) {
    return this.catalog.createModifierOption(groupId, dto);
  }

  @Patch("modifier-groups/:groupId/options/:optionId")
  @ApiOperation({ summary: "Sua / an tuy chon modifier" })
  updateModifierOption(
    @Param("groupId", new ParseUUIDPipe()) groupId: string,
    @Param("optionId", new ParseUUIDPipe()) optionId: string,
    @Body() dto: UpdateModifierOptionDto,
  ) {
    return this.catalog.updateModifierOption(groupId, optionId, dto);
  }
}
