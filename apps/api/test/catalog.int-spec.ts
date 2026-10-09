/**
 * Integration test catalog (bước 06) qua HTTP + DB that.
 * CHI chay khi TEST_DATABASE_URL duoc dat; khong co thi skip.
 */
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ApiErrorCode } from "@coffee-order/contracts";
import { SignJWT } from "jose";
import request from "supertest";
import { AppConfigModule } from "../src/common/config/app-config.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { PrismaModule } from "../src/prisma/prisma.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { AuthModule } from "../src/modules/auth/auth.module";
import { CatalogModule } from "../src/modules/catalog/catalog.module";

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

describeIfDb("catalog integration", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<typeof request>;

  const ADMIN = randomUUID();
  const STAFF_A = randomUUID();
  const CUSTOMER = randomUUID();
  let storeAId: string;
  let storeBId: string;
  let adminAuth: string;
  let staffAuth: string;
  let customerAuth: string;

  beforeAll(async () => {
    if (!TEST_URL) return;
    if (/prod/i.test(TEST_URL)) throw new Error("TEST_DATABASE_URL tro production.");
    if (DEV_URL && TEST_URL === DEV_URL) throw new Error("Trung DB dev.");

    execFileSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "reset", "--force"],
      { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: TEST_URL }, stdio: "pipe" },
    );

    process.env.SUPABASE_JWT_SECRET = SECRET;
    process.env.SUPABASE_JWT_ISSUER = ISSUER;
    process.env.SUPABASE_JWT_AUDIENCE = "authenticated";
    process.env.DATABASE_URL = TEST_URL;

    const moduleRef = await Test.createTestingModule({
      imports: [AppConfigModule, PrismaModule, AuthModule, CatalogModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);
    http = request(app.getHttpServer());

    const a = await prisma.store.create({ data: { code: "SA", name: "Store A", address: "a" } });
    const b = await prisma.store.create({ data: { code: "SB", name: "Store B", address: "b" } });
    storeAId = a.id;
    storeBId = b.id;

    await prisma.profile.create({ data: { id: ADMIN, role: "ADMIN" } });
    await prisma.profile.create({ data: { id: STAFF_A, role: "STAFF" } });
    await prisma.profile.create({ data: { id: CUSTOMER, role: "CUSTOMER" } });
    await prisma.storeStaff.create({ data: { storeId: a.id, userId: STAFF_A } });

    adminAuth = `Bearer ${await token(ADMIN)}`;
    staffAuth = `Bearer ${await token(STAFF_A)}`;
    customerAuth = `Bearer ${await token(CUSTOMER)}`;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  /* ---- Admin CRUD + rang buoc ---- */

  let categoryId: string;
  let productId: string;
  let variantId: string;
  let groupId: string;

  it("ADMIN tao category", async () => {
    const res = await http
      .post("/v1/admin/categories")
      .set("Authorization", adminAuth)
      .send({ name: "Ca phe", slug: "ca-phe", sortOrder: 1 })
      .expect(201);
    categoryId = res.body.id;
    expect(res.body.slug).toBe("ca-phe");
  });

  it("slug category trung -> 400 VALIDATION_ERROR", async () => {
    const res = await http
      .post("/v1/admin/categories")
      .set("Authorization", adminAuth)
      .send({ name: "Khac", slug: "ca-phe" })
      .expect(400);
    expect(res.body.code).toBe(ApiErrorCode.VALIDATION_ERROR);
  });

  it("CUSTOMER tao category -> 403", async () => {
    await http
      .post("/v1/admin/categories")
      .set("Authorization", customerAuth)
      .send({ name: "X", slug: "x" })
      .expect(403);
  });

  it("ADMIN tao product + variant", async () => {
    const p = await http
      .post("/v1/admin/products")
      .set("Authorization", adminAuth)
      .send({ categoryId, name: "Ca phe sua da", slug: "ca-phe-sua-da" })
      .expect(201);
    productId = p.body.id;

    const v = await http
      .post(`/v1/admin/products/${productId}/variants`)
      .set("Authorization", adminAuth)
      .send({ sku: "CFSD-M", size: "M", priceVnd: 35000 })
      .expect(201);
    variantId = v.body.variants.find((x: { size: string }) => x.size === "M").id;
    expect(v.body.fromPriceVnd).toBe(35000);
  });

  it("gia am -> 400 (DTO chan)", async () => {
    await http
      .post(`/v1/admin/products/${productId}/variants`)
      .set("Authorization", adminAuth)
      .send({ sku: "NEG", size: "XS", priceVnd: -1 })
      .expect(400);
  });

  it("SKU trung -> 400", async () => {
    const res = await http
      .post(`/v1/admin/products/${productId}/variants`)
      .set("Authorization", adminAuth)
      .send({ sku: "CFSD-M", size: "L", priceVnd: 45000 })
      .expect(400);
    expect(res.body.code).toBe(ApiErrorCode.VALIDATION_ERROR);
  });

  it("size trung trong cung product -> 400", async () => {
    await http
      .post(`/v1/admin/products/${productId}/variants`)
      .set("Authorization", adminAuth)
      .send({ sku: "CFSD-M2", size: "M", priceVnd: 36000 })
      .expect(400);
  });

  it("modifier group max < min -> 400", async () => {
    await http
      .post("/v1/admin/modifier-groups")
      .set("Authorization", adminAuth)
      .send({ name: "Bad", minSelect: 2, maxSelect: 1 })
      .expect(400);
  });

  it("ADMIN tao modifier group + option va gan vao product", async () => {
    const g = await http
      .post("/v1/admin/modifier-groups")
      .set("Authorization", adminAuth)
      .send({ name: "Topping", minSelect: 0, maxSelect: 2 })
      .expect(201);
    groupId = g.body.id;

    await http
      .post(`/v1/admin/modifier-groups/${groupId}/options`)
      .set("Authorization", adminAuth)
      .send({ name: "Thach", extraPriceVnd: 10000 })
      .expect(201);

    // option trung ten trong nhom -> 400
    await http
      .post(`/v1/admin/modifier-groups/${groupId}/options`)
      .set("Authorization", adminAuth)
      .send({ name: "Thach", extraPriceVnd: 12000 })
      .expect(400);

    const put = await http
      .put(`/v1/admin/products/${productId}/modifier-groups`)
      .set("Authorization", adminAuth)
      .send({ groupIds: [groupId] })
      .expect(200);
    expect(put.body.modifierGroups).toHaveLength(1);
    expect(put.body.modifierGroups[0].options).toHaveLength(1);
  });

  it("gan group khong ton tai -> 404", async () => {
    await http
      .put(`/v1/admin/products/${productId}/modifier-groups`)
      .set("Authorization", adminAuth)
      .send({ groupIds: [randomUUID()] })
      .expect(404);
    // Khoi phuc gan dung lai.
    await http
      .put(`/v1/admin/products/${productId}/modifier-groups`)
      .set("Authorization", adminAuth)
      .send({ groupIds: [groupId] })
      .expect(200);
  });

  /* ---- Staff toggle availability ---- */

  it("STAFF store A bat ban variant tai store A -> 200", async () => {
    const res = await http
      .patch(`/v1/staff/stores/${storeAId}/variants/${variantId}`)
      .set("Authorization", staffAuth)
      .send({ isAvailable: true })
      .expect(200);
    expect(res.body.isAvailable).toBe(true);
  });

  it("STAFF store A thao tac store B -> 403 (cross-store)", async () => {
    const res = await http
      .patch(`/v1/staff/stores/${storeBId}/variants/${variantId}`)
      .set("Authorization", staffAuth)
      .send({ isAvailable: true })
      .expect(403);
    expect(res.body.code).toBe(ApiErrorCode.FORBIDDEN);
  });

  it("CUSTOMER toggle availability -> 403", async () => {
    await http
      .patch(`/v1/staff/stores/${storeAId}/variants/${variantId}`)
      .set("Authorization", customerAuth)
      .send({ isAvailable: true })
      .expect(403);
  });

  /* ---- Doc cong khai ---- */

  it("GET /v1/categories cong khai (khong token)", async () => {
    const res = await http.get("/v1/categories").expect(200);
    expect(res.body.some((c: { slug: string }) => c.slug === "ca-phe")).toBe(true);
  });

  it("GET /v1/products khong store -> available=null", async () => {
    const res = await http.get("/v1/products").expect(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    const p = res.body.items.find((x: { id: string }) => x.id === productId);
    expect(p.variants[0].available).toBeNull();
  });

  it("GET /v1/products?storeId=A -> available=true cho variant da bat", async () => {
    const res = await http.get(`/v1/products?storeId=${storeAId}`).expect(200);
    const p = res.body.items.find((x: { id: string }) => x.id === productId);
    expect(p.variants.find((v: { id: string }) => v.id === variantId).available).toBe(true);
    expect(p.fromPriceVnd).toBe(35000);
  });

  it("GET /v1/products?storeId=B -> available=false (chua co store_variant)", async () => {
    const res = await http.get(`/v1/products?storeId=${storeBId}`).expect(200);
    const p = res.body.items.find((x: { id: string }) => x.id === productId);
    expect(p.variants.find((v: { id: string }) => v.id === variantId).available).toBe(false);
    expect(p.fromPriceVnd).toBeNull();
  });

  it("GET /v1/products/:id tra modifier rules", async () => {
    const res = await http.get(`/v1/products/${productId}`).expect(200);
    expect(res.body.modifierGroups).toHaveLength(1);
    expect(res.body.modifierGroups[0].maxSelect).toBe(2);
  });

  it("tat availability -> variant available=false", async () => {
    await http
      .patch(`/v1/staff/stores/${storeAId}/variants/${variantId}`)
      .set("Authorization", staffAuth)
      .send({ isAvailable: false })
      .expect(200);
    const res = await http.get(`/v1/products?storeId=${storeAId}`).expect(200);
    const p = res.body.items.find((x: { id: string }) => x.id === productId);
    expect(p.variants.find((v: { id: string }) => v.id === variantId).available).toBe(false);
  });

  it("an product (isActive=false) -> bien mat khoi catalog cong khai", async () => {
    await http
      .patch(`/v1/admin/products/${productId}`)
      .set("Authorization", adminAuth)
      .send({ isActive: false })
      .expect(200);
    const res = await http.get("/v1/products").expect(200);
    expect(res.body.items.find((x: { id: string }) => x.id === productId)).toBeUndefined();
    // Chi tiet mon an -> 404 voi khach.
    await http.get(`/v1/products/${productId}`).expect(404);
    // Bat lai cho cac assertion sau (neu co).
    await http
      .patch(`/v1/admin/products/${productId}`)
      .set("Authorization", adminAuth)
      .send({ isActive: true })
      .expect(200);
  });

  it("an category -> product trong category an bien mat", async () => {
    await http
      .patch(`/v1/admin/categories/${categoryId}`)
      .set("Authorization", adminAuth)
      .send({ isActive: false })
      .expect(200);
    const res = await http.get("/v1/products").expect(200);
    expect(res.body.items.find((x: { id: string }) => x.id === productId)).toBeUndefined();
  });

  it("pagination: limit vuot max -> 400", async () => {
    await http.get("/v1/products?limit=1000").expect(400);
  });

  it("storeId khong phai UUID -> 400", async () => {
    await http.get("/v1/products?storeId=khong-phai-uuid").expect(400);
  });

  it("product id khong ton tai -> 404", async () => {
    await http.get(`/v1/products/${randomUUID()}`).expect(404);
  });
});
