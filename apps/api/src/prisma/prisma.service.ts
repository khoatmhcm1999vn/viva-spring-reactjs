import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { APP_CONFIG, type AppConfig } from "../common/config/app-config";
import { PrismaClient } from "../generated/prisma/client";

/**
 * PrismaClient dung chung toan ung dung.
 *
 * Prisma 7 bat buoc driver adapter: dung @prisma/adapter-pg (chay tren thu vien pg).
 * Connection string doc tu DATABASE_URL o thoi diem khoi tao; khong ghi gia tri
 * nay ra log.
 *
 * Neu DATABASE_URL chua duoc dat, service van khoi tao duoc nhung khong ket noi;
 * readiness se bao NOT_READY. Day la de /v1/health (liveness) van chay khi chua
 * cau hinh DB, dung yeu cau cua .kiro/steering/03-bootstrap.md.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  readonly configured: boolean;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    const connectionString = process.env.DATABASE_URL ?? "";
    // Adapter van can mot chuoi; khi rong thi danh dau chua cau hinh va khong $connect.
    super({ adapter: new PrismaPg({ connectionString: connectionString || "postgresql://unset" }) });
    this.configured = config.databaseConfigured;
  }

  async onModuleInit(): Promise<void> {
    if (!this.configured) {
      this.logger.warn("DATABASE_URL chua dat - bo qua ket noi DB; /v1/ready se bao NOT_READY.");
      return;
    }
    try {
      await this.$connect();
      this.logger.log("Da ket noi database.");
    } catch (err) {
      // Khong de loi ket noi lam sap process; readiness se phan anh trang thai.
      this.logger.error("Ket noi database that bai khi khoi dong.", err instanceof Error ? err.message : String(err));
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Dung cho readiness. Tra true khi `SELECT 1` thanh cong. */
  async pingDatabase(): Promise<boolean> {
    if (!this.configured) return false;
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
