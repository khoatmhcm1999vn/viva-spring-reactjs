import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type {
  CategoryDto,
  Paginated,
  ProductDetailDto,
  ProductListItemDto,
} from "@coffee-order/contracts";
import { Public } from "../auth/auth.decorators";
import { CatalogService } from "./catalog.service";
import { CategoryQueryDto, ProductDetailQueryDto, ProductQueryDto } from "./dto/query.dto";

/**
 * Catalog cong khai (REQ-100..102). @Public: khach chua dang nhap xem duoc menu.
 */
@ApiTags("catalog")
@Public()
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  @ApiOperation({ summary: "Danh sach danh muc dang hoat dong" })
  listCategories(@Query() query: CategoryQueryDto): Promise<CategoryDto[]> {
    return this.catalog.listCategories(query.includeInactive === true);
  }

  @Get("products")
  @ApiOperation({ summary: "Danh sach mon, loc theo store/category/tu khoa, co phan trang" })
  listProducts(@Query() query: ProductQueryDto): Promise<Paginated<ProductListItemDto>> {
    return this.catalog.listProducts(query);
  }

  @Get("products/:id")
  @ApiOperation({ summary: "Chi tiet mon kem variant va luat modifier" })
  getProduct(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query() query: ProductDetailQueryDto,
  ): Promise<ProductDetailDto> {
    return this.catalog.getProductDetail(id, query.storeId);
  }
}
