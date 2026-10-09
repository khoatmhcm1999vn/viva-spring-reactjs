import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppConfigModule } from "./common/config/app-config.module";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { AuthModule } from "./modules/auth/auth.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CheckoutModule } from "./modules/checkout/checkout.module";
import { HealthModule } from "./modules/health/health.module";
import { MeModule } from "./modules/me/me.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    // .env chi dung o dev/local. Tren server, bien duoc cap boi moi truong chay.
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    AppConfigModule,
    PrismaModule,
    // AuthModule dang ky APP_GUARD global (AuthGuard + RolesGuard). Dat sau Prisma
    // (phu thuoc) va truoc cac module co route de guard ap cho moi route.
    AuthModule,
    HealthModule,
    MeModule,
    CatalogModule,
    CheckoutModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*path");
  }
}
