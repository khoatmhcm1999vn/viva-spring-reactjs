import { Module } from "@nestjs/common";
import { CatalogAdminController } from "./catalog-admin.controller";
import { CatalogStaffController } from "./catalog-staff.controller";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";

/**
 * Catalog: doc cong khai + admin CRUD + staff toggle availability.
 * PrismaService (@Global) va StoreAccessService (@Global tu AuthModule) co san,
 * khong can import lai.
 */
@Module({
  controllers: [CatalogController, CatalogAdminController, CatalogStaffController],
  providers: [CatalogService],
})
export class CatalogModule {}
