import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

/**
 * Cung cap PrismaService toan ung dung. @Global de cac module nghiep vu
 * (them tu buoc 06) khong phai import lai.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
