import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

// Import PrismaModule tuong minh de HealthService resolve duoc PrismaService ke ca
// khi module nay duoc test doc lap. O app.module, PrismaModule la @Global nen
// khong trung lap.
@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
