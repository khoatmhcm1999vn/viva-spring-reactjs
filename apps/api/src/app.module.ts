import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppConfigModule } from "./common/config/app-config.module";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    // .env chi dung o dev/local. Tren server, bien duoc cap boi moi truong chay.
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    AppConfigModule,
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*path");
  }
}
