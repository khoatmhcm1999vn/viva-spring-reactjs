/**
 * Integration test xac thuc + RBAC qua HTTP that, DB that.
 *
 * CHI chay khi TEST_DATABASE_URL duoc dat; khong co thi skip (nhu db-schema.int-spec).
 * Dung HS256 secret cuc bo de ky token test - khong goi Supabase that.
 *
 * Chay:
 *   $env:TEST_DATABASE_URL="postgresql://coffee:coffee_test_pw@localhost:5435/coffee_order_test?schema=public"
 *   pnpm --filter @coffee-order/api run test:int
 */
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  Controller,
  Get,
  Headers,
  Module,
  ValidationPipe,
  type INestApplication,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ApiErrorCode, type AuthenticatedUser } from "@coffee-order/contracts";
import { SignJWT } from "jose";
import request from "supertest";
import { AppConfigModule } from "../src/common/config/app-config.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { PrismaModule } from "../src/prisma/prisma.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { AuthModule } from "../src/modules/auth/auth.module";
import { CurrentUser, Public, Roles } from "../src/modules/auth/auth.decorators";
import { StoreAccessService } from "../src/modules/auth/store-access.service";
import { MeModule } from "../src/modules/me/me.module";

const TEST_URL = process.env.TEST_DATABASE_URL;
const DEV_URL = process.env.DATABASE_URL;
const SECRET = "int-test-secret-khong-phai-production";
const ISSUER = "https://demo.supabase.co/auth/v1";

const describeIfDb = TEST_URL ? describe : describe.skip;

async function token(sub: string): Promise<string> {
  return new SignJWT({ email: "u@demo.test" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuer(ISSUER)
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(SECRET));
}

// Store id "A" duoc truyen qua header x-test-store de controller kiem store-scope,
// tranh bien global. Day chi la tien ich test, khong phai pattern cua app that.
@Controller("test-rbac")
class TestRbacController {
  constructor(private readonly storeAccess: StoreAccessService) {}

  @Get("public")
  @Public()
  pub() {
    return { ok: true };
  }

  @Get("admin-only")
  @Roles("ADMIN")
  adminOnly() {
    return { ok: true };
  }

  @Get("store-scope")
  async storeScope(
    @CurrentUser() user: AuthenticatedUser,
    @Headers("x-test-store") storeId: string,
  ) {
    await this.storeAccess.assertCanActForStore(user, storeId);
    return { ok: true };
  }
}

@Module({ controllers: [TestRbacController] })
class TestRbacModule {}

describeIfDb("auth + rbac integration", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const CUSTOMER_SUB = randomUUID();
  const STAFF_SUB = randomUUID();
  const ADMIN_SUB = randomUUID();
  let storeAId: string;
  let storeBId: string;

  beforeAll(async () => {
    if (!TEST_URL) return;
    if (/prod/i.test(TEST_URL)) throw new Error("TEST_DATABASE_URL tro production. Tu choi.");
    if (DEV_URL && TEST_URL === DEV_URL) {
      throw new Error("TEST_DATABASE_URL trung DATABASE_URL (dev). Can DB rieng.");
    }

    execFileSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "reset", "--force"],
      { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: TEST_URL }, stdio: "pipe" },
    );

    // Cau hinh auth HS256 cho process truoc khi khoi tao app.
    process.env.SUPABASE_JWT_SECRET = SECRET;
    process.env.SUPABASE_JWT_ISSUER = ISSUER;
    process.env.SUPABASE_JWT_AUDIENCE = "authenticated";
    // DATABASE_URL cho PrismaService (dung DB test).
    process.env.DATABASE_URL = TEST_URL;

    const moduleRef = await Test.createTestingModule({
      imports: [AppConfigModule, PrismaModule, AuthModule, MeModule, TestRbacModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // Du lieu: 2 store, 1 staff gan store A, 1 admin.
    const a = await prisma.store.create({ data: { code: "A", name: "A", address: "a" } });
    const b = await prisma.store.create({ data: { code: "B", name: "B", address: "b" } });
    storeAId = a.id;
    storeBId = b.id;

    // Admin + staff: tao profile voi role, va gan staff vao store A.
    await prisma.profile.create({ data: { id: ADMIN_SUB, role: "ADMIN" } });
    await prisma.profile.create({ data: { id: STAFF_SUB, role: "STAFF" } });
    await prisma.storeStaff.create({ data: { storeId: a.id, userId: STAFF_SUB } });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("route @Public khong can token", async () => {
    await request(app.getHttpServer()).get("/v1/test-rbac/public").expect(200);
  });

  it("thieu token -> 401 UNAUTHENTICATED", async () => {
    const res = await request(app.getHttpServer()).get("/v1/me").expect(401);
    expect(res.body.code).toBe(ApiErrorCode.UNAUTHENTICATED);
  });

  it("token rac -> 401", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/me")
      .set("Authorization", "Bearer khong-phai-jwt")
      .expect(401);
    expect(res.body.code).toBe(ApiErrorCode.UNAUTHENTICATED);
  });

  it("token hop le lan dau -> auto-provision CUSTOMER, GET /me tra role CUSTOMER", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/me")
      .set("Authorization", `Bearer ${await token(CUSTOMER_SUB)}`)
      .expect(200);
    expect(res.body.id).toBe(CUSTOMER_SUB);
    expect(res.body.role).toBe("CUSTOMER");
    expect(res.body.staffStoreIds).toEqual([]);
    // Khong lo token/secret trong response.
    expect(JSON.stringify(res.body)).not.toContain(SECRET);
  });

  it("CUSTOMER goi route ADMIN -> 403 FORBIDDEN", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/test-rbac/admin-only")
      .set("Authorization", `Bearer ${await token(CUSTOMER_SUB)}`)
      .expect(403);
    expect(res.body.code).toBe(ApiErrorCode.FORBIDDEN);
  });

  it("ADMIN goi route ADMIN -> 200", async () => {
    await request(app.getHttpServer())
      .get("/v1/test-rbac/admin-only")
      .set("Authorization", `Bearer ${await token(ADMIN_SUB)}`)
      .expect(200);
  });

  it("STAFF store A thao tac store A -> 200", async () => {
    await request(app.getHttpServer())
      .get("/v1/test-rbac/store-scope")
      .set("Authorization", `Bearer ${await token(STAFF_SUB)}`)
      .set("x-test-store", storeAId)
      .expect(200);
  });

  it("STAFF store A thao tac store B -> 403 (cross-store)", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/test-rbac/store-scope")
      .set("Authorization", `Bearer ${await token(STAFF_SUB)}`)
      .set("x-test-store", storeBId)
      .expect(403);
    expect(res.body.code).toBe(ApiErrorCode.FORBIDDEN);
  });

  it("CUSTOMER thao tac store A (store-scope) -> 403", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/test-rbac/store-scope")
      .set("Authorization", `Bearer ${await token(CUSTOMER_SUB)}`)
      .set("x-test-store", storeAId)
      .expect(403);
    expect(res.body.code).toBe(ApiErrorCode.FORBIDDEN);
  });

  it("GET /me cua STAFF liet ke dung store duoc gan", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/me")
      .set("Authorization", `Bearer ${await token(STAFF_SUB)}`)
      .expect(200);
    expect(res.body.role).toBe("STAFF");
    expect(res.body.staffStoreIds).toEqual([storeAId]);
  });

  it("role doi trong DB co hieu luc ngay o lan goi sau", async () => {
    // Nang CUSTOMER_SUB len ADMIN trong DB.
    await prisma.profile.update({ where: { id: CUSTOMER_SUB }, data: { role: "ADMIN" } });
    await request(app.getHttpServer())
      .get("/v1/test-rbac/admin-only")
      .set("Authorization", `Bearer ${await token(CUSTOMER_SUB)}`)
      .expect(200);
  });
});
