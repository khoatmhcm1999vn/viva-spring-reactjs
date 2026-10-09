import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ReadinessCheckStatus } from "@coffee-order/contracts";
import request from "supertest";
import { AppConfigModule } from "../../common/config/app-config.module";
import { AllExceptionsFilter } from "../../common/filters/all-exceptions.filter";
import { loadAppConfig } from "../../common/config/app-config";
import { PrismaService } from "../../prisma/prisma.service";
import { HealthModule } from "./health.module";

describe("app-config", () => {
  it("dat mac dinh port 3001 va cors localhost:3000 khi env rong", () => {
    const c = loadAppConfig({} as NodeJS.ProcessEnv);
    expect(c.port).toBe(3001);
    expect(c.corsOrigins).toEqual(["http://localhost:3000"]);
    expect(c.databaseConfigured).toBe(false);
  });

  it("tu choi CORS_ORIGINS chua wildcard", () => {
    expect(() => loadAppConfig({ CORS_ORIGINS: "*" } as NodeJS.ProcessEnv)).toThrow(
      /CORS_ORIGINS/,
    );
  });

  it("tu choi PORT khong phai so nguyen hop le", () => {
    expect(() => loadAppConfig({ PORT: "abc" } as NodeJS.ProcessEnv)).toThrow(/PORT/);
  });

  it("khong luu gia tri DATABASE_URL vao config", () => {
    const c = loadAppConfig({
      DATABASE_URL: "postgresql://u:p@h:5432/db",
    } as NodeJS.ProcessEnv);
    expect(c.databaseConfigured).toBe(true);
    expect(JSON.stringify(c)).not.toContain("postgresql://");
  });
});

describe("health endpoints", () => {
  let app: INestApplication;

  beforeAll(async () => {
    delete process.env.DATABASE_URL;

    // Thay PrismaService that bang stub: unit test khong can DB. Khi
    // databaseConfigured=false, readiness tra NOT_CONFIGURED nen pingDatabase
    // khong duoc goi. Cung cap stub nhu mot provider vi HealthModule khong tu
    // import PrismaModule (binh thuong la @Global o app.module).
    const prismaStub: Pick<PrismaService, "pingDatabase"> = {
      pingDatabase: async () => false,
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppConfigModule, HealthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaStub)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /v1/health tra 200 va khong chua secret", async () => {
    const res = await request(app.getHttpServer()).get("/v1/health").expect(200);

    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("coffee-order-api");
    expect(typeof res.body.timestamp).toBe("string");

    const raw = JSON.stringify(res.body);
    for (const leak of ["DATABASE_URL", "postgresql://", "SUPABASE", "SECRET", "password"]) {
      expect(raw).not.toContain(leak);
    }
  });

  it("GET /v1/ready tra 503 NOT_READY khi chua cau hinh DB", async () => {
    const res = await request(app.getHttpServer()).get("/v1/ready").expect(503);

    expect(res.body.status).toBe("NOT_READY");
    expect(res.body.checks.database).toBe(ReadinessCheckStatus.NOT_CONFIGURED);
  });

  it("route khong ton tai tra body loi dang {code,message,requestId}", async () => {
    const res = await request(app.getHttpServer()).get("/v1/khong-ton-tai").expect(404);

    expect(res.body.code).toBe("NOT_FOUND");
    expect(typeof res.body.requestId).toBe("string");
    expect(res.body.stack).toBeUndefined();
  });
});
