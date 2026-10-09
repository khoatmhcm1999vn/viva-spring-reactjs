import { Inject, Injectable } from "@nestjs/common";
import {
  ReadinessCheckStatus,
  type HealthResponse,
  type ReadyResponse,
} from "@coffee-order/contracts";
import { APP_CONFIG, type AppConfig } from "../../common/config/app-config";

@Injectable()
export class HealthService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

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
   * Buoc 03 chua co Prisma nen chi kiem DATABASE_URL da duoc dat hay chua.
   * Buoc 04 se thay cho nay bang mot truy van thuc (`SELECT 1`) qua Prisma.
   */
  readiness(): ReadyResponse {
    const database = this.config.databaseConfigured
      ? ReadinessCheckStatus.OK
      : ReadinessCheckStatus.NOT_CONFIGURED;

    return {
      status: database === ReadinessCheckStatus.OK ? "READY" : "NOT_READY",
      checks: { database },
      timestamp: new Date().toISOString(),
    };
  }
}
