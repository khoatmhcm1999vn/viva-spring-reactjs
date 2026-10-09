import { Inject, Injectable } from "@nestjs/common";
import {
  ReadinessCheckStatus,
  type HealthResponse,
  type ReadyResponse,
} from "@coffee-order/contracts";
import { APP_CONFIG, type AppConfig } from "../../common/config/app-config";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Liveness: process con song va phuc vu duoc HTTP.
   * Khong doc DB, khong tra gia tri bien moi truong nao.
   */
  liveness(): HealthResponse {
    return {
      status: "ok",
      service: this.config.serviceName,
      version: this.config.serviceVersion,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness: du dieu kien nhan traffic that chua.
   *
   * Tu buoc 04: thuc hien `SELECT 1` qua Prisma. NOT_CONFIGURED khi chua co
   * DATABASE_URL; ERROR khi co cau hinh nhung ket noi/truy van that bai;
   * OK khi truy van thanh cong.
   */
  async readiness(): Promise<ReadyResponse> {
    let database: ReadinessCheckStatus;
    if (!this.config.databaseConfigured) {
      database = ReadinessCheckStatus.NOT_CONFIGURED;
    } else {
      database = (await this.prisma.pingDatabase())
        ? ReadinessCheckStatus.OK
        : ReadinessCheckStatus.ERROR;
    }

    return {
      status: database === ReadinessCheckStatus.OK ? "READY" : "NOT_READY",
      checks: { database },
      timestamp: new Date().toISOString(),
    };
  }
}
