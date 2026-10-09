import { Controller, Get, Res } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { HealthResponse, ReadyResponse } from "@coffee-order/contracts";
import type { Response } from "express";
import { HealthService } from "./health.service";

@ApiTags("health")
@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Liveness. Khong doc DB, khong tra secret hay gia tri bien moi truong. */
  @Get("health")
  @ApiOperation({ summary: "Liveness - process con phuc vu duoc HTTP" })
  @ApiResponse({ status: 200, description: "Service dang song" })
  getHealth(): HealthResponse {
    return this.health.liveness();
  }

  /**
   * Readiness. Tra 200 khi READY, 503 khi NOT_READY.
   * Buoc 03 chi kiem DATABASE_URL da duoc dat chua; buoc 04 doi sang truy van thuc.
   */
  @Get("ready")
  @ApiOperation({ summary: "Readiness - du dieu kien nhan traffic chua" })
  @ApiResponse({ status: 200, description: "San sang" })
  @ApiResponse({ status: 503, description: "Chua san sang" })
  getReady(@Res({ passthrough: true }) res: Response): ReadyResponse {
    const body = this.health.readiness();
    res.status(body.status === "READY" ? 200 : 503);
    return body;
  }
}
