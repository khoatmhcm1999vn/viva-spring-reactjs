/**
 * Integration test bao gia (bước 07) qua HTTP + DB that.
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
import { CheckoutModule } from "../src/modules/checkout/checkout.module";

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

describeIfDb("checkout quote integration", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<typeof request>;

  const CUSTOMER = randomUUID();
  let customerAuth: string;

  let storeId: string;
  let storeClosedId: string;
  let variantMId: string; // Ca phe M, co modifier Topping (0..2) + Da (1..1)
  let variantLId: string; // size L
  let inactiveVariantId: string;
  let toppingThachId: string;
  let toppingKemId: string;
  let toppingTranChauId: string;
  let daBtId: string;
  let daItId: string;
  let otherProductOptionId: string; // option thuoc product khac
  let unavailableVariantId: string; // variant active nhung store_variant.is_available=false

  const recipient = { name: "Nguyen Van Minh", phone: "0901234567" };

  function body(items: unknown) {
    return {
      storeId,
      fulfillmentType: "PICKUP",
      paymentMethod: "PAY_AT_COUNTER",
      recipient,
      items,
    };
  }

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
      imports: [AppConfigModule, PrismaModule, AuthModule, CheckoutModule],
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

    await prisma.profile.create({ data: { id: CUSTOMER, role: "CUSTOMER" } });
    customerAuth = `Bearer ${await token(CUSTOMER)}`;

    // 2 store: 1 active, 1 dong.
    const store = await prisma.store.create({ data: { code: "S", name: "Store", address: "a" } });
    const closed = await prisma.store.create({
      data: { code: "SC", name: "Closed", address: "c", isActive: false },
    });
    storeId = store.id;
    storeClosedId = closed.id;

    const cat = await prisma.category.create({ data: { name: "Ca phe", slug: "ca-phe" } });
    const product = await prisma.product.create({
      data: { name: "Ca phe sua da", slug: "cf-sua-da", categoryId: cat.id },
    });
    const otherProduct = await prisma.product.create({
      data: { name: "Tra", slug: "tra", categoryId: cat.id },
    });

    const vM = await prisma.productVariant.create({
      data: { productId: product.id, sku: "CF-M", size: "M", priceVnd: 35000 },
    });
    const vL = await prisma.productVariant.create({
      data: { productId: product.id, sku: "CF-L", size: "L", priceVnd: 45000 },
    });
    const vInactive = await prisma.productVariant.create({
      data: { productId: product.id, sku: "CF-XS", size: "XS", priceVnd: 25000, isActive: false },
    });
    const vUnavail = await prisma.productVariant.create({
      data: { productId: product.id, sku: "CF-XL", size: "XL", priceVnd: 55000 },
    });
    const vOther = await prisma.productVariant.create({
      data: { productId: otherProduct.id, sku: "TRA-M", size: "M", priceVnd: 40000 },
    });
    variantMId = vM.id;
    variantLId = vL.id;
    inactiveVariantId = vInactive.id;
    unavailableVariantId = vUnavail.id;

    // Availability tai store: M, L, XL co ban; XL set is_available=false; inactive khong tao.
    await prisma.storeVariant.createMany({
      data: [
        { storeId: store.id, variantId: vM.id, isAvailable: true },
        { storeId: store.id, variantId: vL.id, isAvailable: true },
        { storeId: store.id, variantId: vUnavail.id, isAvailable: false },
        { storeId: store.id, variantId: vOther.id, isAvailable: true },
      ],
    });

    // Modifier: nhom "Da" (1..1), nhom "Topping" (0..2) gan cho product.
    const groupDa = await prisma.modifierGroup.create({
      data: { name: "Muc da", minSelect: 1, maxSelect: 1 },
    });
    const groupTopping = await prisma.modifierGroup.create({
      data: { name: "Topping", minSelect: 0, maxSelect: 2 },
    });
    const daBt = await prisma.modifierOption.create({
      data: { groupId: groupDa.id, name: "Da binh thuong", extraPriceVnd: 0 },
    });
    const daIt = await prisma.modifierOption.create({
      data: { groupId: groupDa.id, name: "It da", extraPriceVnd: 0 },
    });
    const thach = await prisma.modifierOption.create({
      data: { groupId: groupTopping.id, name: "Thach", extraPriceVnd: 10000 },
    });
    const kem = await prisma.modifierOption.create({
      data: { groupId: groupTopping.id, name: "Kem pho mai", extraPriceVnd: 15000 },
    });
    const tranChau = await prisma.modifierOption.create({
      data: { groupId: groupTopping.id, name: "Tran chau", extraPriceVnd: 10000 },
    });
    daBtId = daBt.id;
    daItId = daIt.id;
    toppingThachId = thach.id;
    toppingKemId = kem.id;
    toppingTranChauId = tranChau.id;

    // Option thuoc product khac (nhom KHONG gan cho product dang test).
    const groupOther = await prisma.modifierGroup.create({
      data: { name: "Nhom khac", minSelect: 0, maxSelect: 1 },
    });
    const optOther = await prisma.modifierOption.create({
      data: { groupId: groupOther.id, name: "Khac", extraPriceVnd: 5000 },
    });
    otherProductOptionId = optOther.id;

    await prisma.productModifierGroup.createMany({
      data: [
        { productId: product.id, groupId: groupDa.id },
        { productId: product.id, groupId: groupTopping.id },
      ],
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("thieu token -> 401", async () => {
    await http.post("/v1/checkout/quote").send(body([])).expect(401);
  });

  it("gia tinh o server: base + modifiers, line_total = unit * qty", async () => {
    const res = await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(
        body([
          {
            variantId: variantMId,
            quantity: 2,
            modifierOptionIds: [daBtId, toppingThachId],
            note: "  it ngot ",
          },
        ]),
      )
      .expect(200);

    const line = res.body.items[0];
    expect(line.basePriceVnd).toBe(35000);
    expect(line.unitPriceVnd).toBe(45000); // 35000 + 10000 (thach); da = 0
    expect(line.lineTotalVnd).toBe(90000); // 45000 * 2
    expect(line.note).toBe("it ngot"); // da normalize
    expect(res.body.subtotalVnd).toBe(90000);
    expect(res.body.totalVnd).toBe(90000);
    expect(res.body.shippingFeeVnd).toBe(0);
    expect(res.body.discountVnd).toBe(0);
    expect(typeof res.body.quoteId).toBe("string");
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    // Khong tin gia client: body gui len khong co truong gia nen khong the chen.
  });

  it("luu checkout_quotes voi snapshot + expires_at", async () => {
    const res = await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(body([{ variantId: variantMId, quantity: 1, modifierOptionIds: [daItId] }]))
      .expect(200);
    const row = await prisma.checkoutQuote.findUnique({ where: { id: res.body.quoteId } });
    expect(row).not.toBeNull();
    expect(row!.userId).toBe(CUSTOMER);
    expect(row!.totalVnd).toBe(35000);
    expect(row!.requestHash).toHaveLength(64); // sha256 hex
    expect(row!.expiresAt.getTime()).toBeGreaterThan(row!.createdAt.getTime());
  });

  it("cung mon khac topping -> hai dong rieng, gia khac", async () => {
    const res = await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(
        body([
          { variantId: variantMId, quantity: 1, modifierOptionIds: [daBtId, toppingThachId] },
          { variantId: variantMId, quantity: 1, modifierOptionIds: [daBtId, toppingKemId] },
        ]),
      )
      .expect(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.subtotalVnd).toBe(45000 + 50000); // thach 10k, kem 15k
  });

  it("option khong thuoc mon -> 400", async () => {
    const res = await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(
        body([{ variantId: variantMId, quantity: 1, modifierOptionIds: [daBtId, otherProductOptionId] }]),
      )
      .expect(400);
    expect(res.body.code).toBe(ApiErrorCode.VALIDATION_ERROR);
  });

  it("thieu nhom bat buoc (Da 1..1) -> 400", async () => {
    const res = await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(body([{ variantId: variantMId, quantity: 1, modifierOptionIds: [toppingThachId] }]))
      .expect(400);
    expect(res.body.code).toBe(ApiErrorCode.VALIDATION_ERROR);
  });

  it("vuot max topping (chon 3, max 2) -> 400", async () => {
    await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(
        body([
          {
            variantId: variantMId,
            quantity: 1,
            modifierOptionIds: [daBtId, toppingThachId, toppingKemId, toppingTranChauId],
          },
        ]),
      )
      .expect(400);
  });

  it("chon 2 option cung nhom Da (max 1) -> 400", async () => {
    await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(body([{ variantId: variantMId, quantity: 1, modifierOptionIds: [daBtId, daItId] }]))
      .expect(400);
  });

  it("variant inactive -> 409 ITEM_UNAVAILABLE", async () => {
    const res = await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(body([{ variantId: inactiveVariantId, quantity: 1, modifierOptionIds: [daBtId] }]))
      .expect(409);
    expect(res.body.code).toBe(ApiErrorCode.ITEM_UNAVAILABLE);
  });

  it("variant khong available tai store -> 409 ITEM_UNAVAILABLE", async () => {
    const res = await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(body([{ variantId: unavailableVariantId, quantity: 1, modifierOptionIds: [daBtId] }]))
      .expect(409);
    expect(res.body.code).toBe(ApiErrorCode.ITEM_UNAVAILABLE);
  });

  it("cua hang dong -> 409 ITEM_UNAVAILABLE", async () => {
    const res = await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send({
        storeId: storeClosedId,
        fulfillmentType: "PICKUP",
        paymentMethod: "PAY_AT_COUNTER",
        recipient,
        items: [{ variantId: variantMId, quantity: 1, modifierOptionIds: [daBtId] }],
      })
      .expect(409);
    expect(res.body.code).toBe(ApiErrorCode.ITEM_UNAVAILABLE);
  });

  it("quantity 0 -> 400 (DTO)", async () => {
    await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(body([{ variantId: variantMId, quantity: 0, modifierOptionIds: [daBtId] }]))
      .expect(400);
  });

  it("quantity > 20 -> 400 (DTO)", async () => {
    await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(body([{ variantId: variantMId, quantity: 21, modifierOptionIds: [daBtId] }]))
      .expect(400);
  });

  it("items rong -> 400 (DTO ArrayMinSize)", async () => {
    await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(body([]))
      .expect(400);
  });

  it("modifierOptionIds trung trong DTO -> 400", async () => {
    await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(body([{ variantId: variantMId, quantity: 1, modifierOptionIds: [daBtId, daBtId] }]))
      .expect(400);
  });

  it("note qua dai (>200) -> 400", async () => {
    await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(
        body([
          { variantId: variantMId, quantity: 1, modifierOptionIds: [daBtId], note: "x".repeat(201) },
        ]),
      )
      .expect(400);
  });

  it("fulfillmentType khac PICKUP -> 400", async () => {
    await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send({
        storeId,
        fulfillmentType: "DELIVERY",
        paymentMethod: "PAY_AT_COUNTER",
        recipient,
        items: [{ variantId: variantMId, quantity: 1, modifierOptionIds: [daBtId] }],
      })
      .expect(400);
  });

  it("truong la trong body -> 400 (forbidNonWhitelisted)", async () => {
    await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send({ ...body([{ variantId: variantMId, quantity: 1, modifierOptionIds: [daBtId] }]), totalVnd: 1 })
      .expect(400);
  });

  it("variantL quote dung gia 45000", async () => {
    const res = await http
      .post("/v1/checkout/quote")
      .set("Authorization", customerAuth)
      .send(body([{ variantId: variantLId, quantity: 1, modifierOptionIds: [daBtId] }]))
      .expect(200);
    expect(res.body.totalVnd).toBe(45000);
  });
});
