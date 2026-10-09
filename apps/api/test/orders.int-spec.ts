/**
 * Integration test tao don an toan (bước 08) qua HTTP + PostgreSQL that.
 * CHI chay khi TEST_DATABASE_URL duoc dat; khong co thi skip.
 *
 * Phu checklist steering: double-click, concurrent, timeout retry, cung key khac
 * payload, quote reuse, price change, quote expired, rollback giua item inserts,
 * atomic order/items/payment/history, snapshot khong doi khi menu doi.
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
import { OrdersModule } from "../src/modules/orders/orders.module";
import { OrdersService } from "../src/modules/orders/orders.service";

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

/**
 * Subclass chi dung trong test: nem loi GIUA chuoi insert item de chung minh
 * transaction rollback sach. Khong can fault-injection trong code production.
 */
class FailingOrdersService extends OrdersService {
  static shouldFail = false;
  protected override async insertItems(
    tx: Parameters<OrdersService["insertItems"]>[0],
    orderId: string,
    lines: Parameters<OrdersService["insertItems"]>[2],
  ): Promise<void> {
    if (!FailingOrdersService.shouldFail) {
      return super.insertItems(tx, orderId, lines);
    }
    // Insert dong dau roi nem loi -> order + item dau phai bi rollback.
    const first = lines[0]!;
    await tx.orderItem.create({
      data: {
        orderId,
        variantId: first.variantId,
        productNameSnapshot: first.productName,
        sizeSnapshot: first.size,
        basePriceVnd: first.basePriceVnd,
        unitPriceVnd: first.unitPriceVnd,
        quantity: first.quantity,
        lineTotalVnd: first.lineTotalVnd,
        note: first.note,
      },
    });
    throw new Error("loi inject giua chuoi insert item");
  }
}

describeIfDb("orders integration", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<typeof request>;

  const CUSTOMER = randomUUID();
  const OTHER = randomUUID();
  let auth: string;
  let otherAuth: string;

  let storeId: string;
  let variantMId: string;
  let variantLId: string;
  let daBtId: string;
  let toppingThachId: string;

  const recipient = { name: "Nguyen Van Minh", phone: "0901234567" };

  function cart(items?: unknown) {
    return {
      storeId,
      fulfillmentType: "PICKUP" as const,
      paymentMethod: "PAY_AT_COUNTER" as const,
      recipient,
      items:
        items ??
        [{ variantId: variantMId, quantity: 2, modifierOptionIds: [daBtId, toppingThachId], note: "it ngot" }],
    };
  }

  /**
   * Lam quote het han.
   *
   * KHONG the chi set expires_at ve qua khu: CHECK `chk_quote_expiry_after_created`
   * (bước 04) yeu cau expires_at > created_at. Phai lui CA HAI moc vao qua khu.
   */
  async function expireQuote(quoteId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE checkout_quotes
      SET created_at = now() - interval '10 minutes',
          expires_at = now() - interval '5 minutes'
      WHERE id = ${quoteId}::uuid
    `;
  }

  /** Bao gia roi tra quoteId + cart da dung de bao gia. */
  async function makeQuote(items?: unknown) {
    const payload = cart(items);
    const res = await http
      .post("/v1/checkout/quote")
      .set("Authorization", auth)
      .send(payload)
      .expect(200);
    return { quoteId: res.body.quoteId as string, payload, total: res.body.totalVnd as number };
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
      imports: [AppConfigModule, PrismaModule, AuthModule, CheckoutModule, OrdersModule],
    })
      .overrideProvider(OrdersService)
      .useClass(FailingOrdersService)
      .compile();

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
    await prisma.profile.create({ data: { id: OTHER, role: "CUSTOMER" } });
    auth = `Bearer ${await token(CUSTOMER)}`;
    otherAuth = `Bearer ${await token(OTHER)}`;

    const store = await prisma.store.create({ data: { code: "S", name: "Store A", address: "12 Nguyen Hue" } });
    storeId = store.id;

    const cat = await prisma.category.create({ data: { name: "Ca phe", slug: "ca-phe" } });
    const product = await prisma.product.create({
      data: { name: "Ca phe sua da", slug: "cf-sua-da", categoryId: cat.id },
    });
    const vM = await prisma.productVariant.create({
      data: { productId: product.id, sku: "CF-M", size: "M", priceVnd: 35000 },
    });
    const vL = await prisma.productVariant.create({
      data: { productId: product.id, sku: "CF-L", size: "L", priceVnd: 45000 },
    });
    variantMId = vM.id;
    variantLId = vL.id;
    await prisma.storeVariant.createMany({
      data: [
        { storeId: store.id, variantId: vM.id, isAvailable: true },
        { storeId: store.id, variantId: vL.id, isAvailable: true },
      ],
    });

    const groupDa = await prisma.modifierGroup.create({
      data: { name: "Muc da", minSelect: 1, maxSelect: 1 },
    });
    const groupTopping = await prisma.modifierGroup.create({
      data: { name: "Topping", minSelect: 0, maxSelect: 2 },
    });
    const daBt = await prisma.modifierOption.create({
      data: { groupId: groupDa.id, name: "Da binh thuong", extraPriceVnd: 0 },
    });
    const thach = await prisma.modifierOption.create({
      data: { groupId: groupTopping.id, name: "Thach", extraPriceVnd: 10000 },
    });
    daBtId = daBt.id;
    toppingThachId = thach.id;
    await prisma.productModifierGroup.createMany({
      data: [
        { productId: product.id, groupId: groupDa.id },
        { productId: product.id, groupId: groupTopping.id },
      ],
    });
  });

  beforeEach(() => {
    FailingOrdersService.shouldFail = false;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  /* --------------------------- Tao don co ban --------------------------- */

  it("thieu Idempotency-Key -> 400", async () => {
    const { quoteId, payload } = await makeQuote();
    const res = await http
      .post("/v1/orders")
      .set("Authorization", auth)
      .send({ quoteId, ...payload })
      .expect(400);
    expect(res.body.code).toBe(ApiErrorCode.VALIDATION_ERROR);
  });

  it("tao don thanh cong -> 201, atomic order+items+modifiers+payment+history", async () => {
    const { quoteId, payload, total } = await makeQuote();
    const key = randomUUID();
    const res = await http
      .post("/v1/orders")
      .set("Authorization", auth)
      .set("Idempotency-Key", key)
      .send({ quoteId, ...payload })
      .expect(201);

    expect(res.body.code).toMatch(/^CF-\d{6}-[0-9A-HJKMNP-TV-Z]{4}$/);
    expect(res.body.status).toBe("PLACED");
    expect(res.body.version).toBe(0);
    expect(res.body.totals.totalVnd).toBe(total);
    expect(res.body.totals.shippingFeeVnd).toBe(0);
    expect(res.body.payment.status).toBe("UNPAID");
    expect(res.body.payment.method).toBe("PAY_AT_COUNTER");
    expect(res.body.payment.amountVnd).toBe(total);
    expect(res.body.storeName).toBe("Store A");
    // Buoc 09 bo sung `private` (chi tiet don chua PII nguoi nhan).
    expect(res.headers["cache-control"]).toContain("no-store");
    expect(res.headers["cache-control"]).toContain("private");

    const orderId = res.body.id;
    // Kiem atomic trong DB.
    const items = await prisma.orderItem.findMany({ where: { orderId }, include: { modifiers: true } });
    expect(items).toHaveLength(1);
    expect(items[0]!.unitPriceVnd).toBe(45000); // 35000 + 10000
    expect(items[0]!.lineTotalVnd).toBe(90000);
    expect(items[0]!.modifiers).toHaveLength(2);
    const payments = await prisma.payment.findMany({ where: { orderId } });
    expect(payments).toHaveLength(1);
    const history = await prisma.orderStatusHistory.findMany({ where: { orderId } });
    expect(history).toHaveLength(1);
    expect(history[0]!.fromStatus).toBeNull();
    expect(history[0]!.toStatus).toBe("PLACED");
    expect(history[0]!.actorId).toBe(CUSTOMER);
    const mapping = await prisma.idempotencyKey.findUnique({
      where: { userId_key: { userId: CUSTOMER, key } },
    });
    expect(mapping!.orderId).toBe(orderId);
  });

  /* --------------------------- Idempotency --------------------------- */

  it("double-click: cung key + cung payload -> 200, cung don, khong tao don thu hai", async () => {
    const { quoteId, payload } = await makeQuote();
    const key = randomUUID();
    const body = { quoteId, ...payload };

    const first = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", key)
      .send(body).expect(201);
    const second = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", key)
      .send(body).expect(200);

    expect(second.body.id).toBe(first.body.id);
    expect(second.body.code).toBe(first.body.code);
    const count = await prisma.order.count({ where: { quoteId } });
    expect(count).toBe(1);
  });

  it("concurrent: hai request song song cung key -> chi mot don duoc commit", async () => {
    const { quoteId, payload } = await makeQuote();
    const key = randomUUID();
    const body = { quoteId, ...payload };

    const send = () =>
      http.post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", key).send(body);
    const [a, b] = await Promise.all([send(), send()]);

    // Bat buoc: DUNG MOT don duoc commit cho quote nay.
    expect(await prisma.order.count({ where: { quoteId } })).toBe(1);

    // Luong thang tra 201; luong thua tra 200 kem CHINH don do.
    const ok = [a, b].filter((r) => r.status === 201 || r.status === 200);
    expect(ok).toHaveLength(2);
    expect(a.body.id).toBe(b.body.id);
    expect([a.status, b.status].sort()).toEqual([200, 201]);
  });

  it("timeout retry: goi lai sau khi da thanh cong -> tra lai don cu (200)", async () => {
    const { quoteId, payload } = await makeQuote();
    const key = randomUUID();
    const body = { quoteId, ...payload };
    const first = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", key)
      .send(body).expect(201);

    // Mo phong timeout o client roi retry cung key/payload.
    const retry = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", key)
      .send(body).expect(200);
    expect(retry.body.id).toBe(first.body.id);
  });

  it("replay van tra don cu KE CA khi quote da het han", async () => {
    const { quoteId, payload } = await makeQuote();
    const key = randomUUID();
    const body = { quoteId, ...payload };
    const first = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", key)
      .send(body).expect(201);

    // Het han quote sau khi da dat.
    await expireQuote(quoteId);

    const replay = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", key)
      .send(body).expect(200);
    expect(replay.body.id).toBe(first.body.id);
  });

  it("cung key nhung payload khac -> 409 IDEMPOTENCY_CONFLICT", async () => {
    const q1 = await makeQuote();
    const key = randomUUID();
    await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", key)
      .send({ quoteId: q1.quoteId, ...q1.payload }).expect(201);

    // Payload khac (doi quantity) nhung dung lai key cu.
    const q2 = await makeQuote([
      { variantId: variantMId, quantity: 1, modifierOptionIds: [daBtId], note: null },
    ]);
    const res = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", key)
      .send({ quoteId: q2.quoteId, ...q2.payload }).expect(409);
    expect(res.body.code).toBe(ApiErrorCode.IDEMPOTENCY_CONFLICT);
  });

  it("quote reuse: cung quote + key khac -> 409 QUOTE_ALREADY_USED", async () => {
    const { quoteId, payload } = await makeQuote();
    const body = { quoteId, ...payload };
    await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", randomUUID())
      .send(body).expect(201);

    const res = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", randomUUID())
      .send(body).expect(409);
    expect(res.body.code).toBe(ApiErrorCode.QUOTE_ALREADY_USED);
  });

  /* --------------------------- Quote invariants --------------------------- */

  it("quote het han -> 410 QUOTE_EXPIRED", async () => {
    const { quoteId, payload } = await makeQuote();
    await expireQuote(quoteId);
    const res = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", randomUUID())
      .send({ quoteId, ...payload }).expect(410);
    expect(res.body.code).toBe(ApiErrorCode.QUOTE_EXPIRED);
  });

  it("gia doi sau khi bao gia -> 409 PRICE_CHANGED, khong tao don", async () => {
    const { quoteId, payload } = await makeQuote();
    // Admin doi gia variant sau khi khach da bao gia.
    await prisma.productVariant.update({ where: { id: variantMId }, data: { priceVnd: 40000 } });

    const res = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", randomUUID())
      .send({ quoteId, ...payload }).expect(409);
    expect(res.body.code).toBe(ApiErrorCode.PRICE_CHANGED);
    expect(await prisma.order.count({ where: { quoteId } })).toBe(0);

    await prisma.productVariant.update({ where: { id: variantMId }, data: { priceVnd: 35000 } });
  });

  it("mon bi tat availability sau khi bao gia -> 409 ITEM_UNAVAILABLE", async () => {
    const { quoteId, payload } = await makeQuote();
    await prisma.storeVariant.update({
      where: { storeId_variantId: { storeId, variantId: variantMId } },
      data: { isAvailable: false },
    });

    const res = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", randomUUID())
      .send({ quoteId, ...payload }).expect(409);
    expect(res.body.code).toBe(ApiErrorCode.ITEM_UNAVAILABLE);
    expect(await prisma.order.count({ where: { quoteId } })).toBe(0);

    await prisma.storeVariant.update({
      where: { storeId_variantId: { storeId, variantId: variantMId } },
      data: { isAvailable: true },
    });
  });

  it("payload khong khop quote -> 400", async () => {
    const { quoteId, payload } = await makeQuote();
    const res = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", randomUUID())
      .send({
        quoteId,
        ...payload,
        items: [{ variantId: variantLId, quantity: 1, modifierOptionIds: [daBtId], note: null }],
      })
      .expect(400);
    expect(res.body.code).toBe(ApiErrorCode.VALIDATION_ERROR);
  });

  it("quote cua nguoi khac -> 404", async () => {
    const { quoteId, payload } = await makeQuote();
    const res = await http
      .post("/v1/orders").set("Authorization", otherAuth).set("Idempotency-Key", randomUUID())
      .send({ quoteId, ...payload }).expect(404);
    expect(res.body.code).toBe(ApiErrorCode.NOT_FOUND);
  });

  /* --------------------------- Rollback --------------------------- */

  it("loi giua chuoi insert item -> rollback sach, khong con don/item/payment/key", async () => {
    const { quoteId, payload } = await makeQuote([
      { variantId: variantMId, quantity: 1, modifierOptionIds: [daBtId], note: null },
      { variantId: variantLId, quantity: 1, modifierOptionIds: [daBtId], note: null },
    ]);
    const key = randomUUID();
    FailingOrdersService.shouldFail = true;

    await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", key)
      .send({ quoteId, ...payload }).expect(500);

    FailingOrdersService.shouldFail = false;

    // Khong con gi mo coi.
    expect(await prisma.order.count({ where: { quoteId } })).toBe(0);
    expect(
      await prisma.idempotencyKey.findUnique({ where: { userId_key: { userId: CUSTOMER, key } } }),
    ).toBeNull();

    // Va sau khi het loi, dat lai bang chinh quote do van thanh cong.
    const ok = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", randomUUID())
      .send({ quoteId, ...payload }).expect(201);
    expect(ok.body.items).toHaveLength(2);
  });

  /* --------------------------- Snapshot --------------------------- */

  it("doi menu sau khi dat -> snapshot don cu KHONG doi", async () => {
    const { quoteId, payload } = await makeQuote();
    const created = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", randomUUID())
      .send({ quoteId, ...payload }).expect(201);
    const before = created.body;

    // Doi ten mon, gia, va ten option sau khi dat.
    await prisma.productVariant.update({ where: { id: variantMId }, data: { priceVnd: 99000 } });
    await prisma.modifierOption.update({
      where: { id: toppingThachId },
      data: { name: "Thach doi ten", extraPriceVnd: 77000 },
    });

    const after = await http
      .get(`/v1/orders/${before.id}`).set("Authorization", auth).expect(200);

    expect(after.body.totals.totalVnd).toBe(before.totals.totalVnd);
    expect(after.body.items[0].unitPriceVnd).toBe(before.items[0].unitPriceVnd);
    expect(after.body.items[0].productName).toBe(before.items[0].productName);
    const thach = after.body.items[0].modifiers.find(
      (m: { optionId: string }) => m.optionId === toppingThachId,
    );
    expect(thach.optionName).toBe("Thach"); // ten cu, khong phai "Thach doi ten"
    expect(thach.extraPriceVnd).toBe(10000); // gia cu

    await prisma.productVariant.update({ where: { id: variantMId }, data: { priceVnd: 35000 } });
    await prisma.modifierOption.update({
      where: { id: toppingThachId },
      data: { name: "Thach", extraPriceVnd: 10000 },
    });
  });

  /* --------------------------- Doc don --------------------------- */

  it("chu don doc duoc don cua minh; nguoi khac -> 404", async () => {
    const { quoteId, payload } = await makeQuote();
    const created = await http
      .post("/v1/orders").set("Authorization", auth).set("Idempotency-Key", randomUUID())
      .send({ quoteId, ...payload }).expect(201);

    await http.get(`/v1/orders/${created.body.id}`).set("Authorization", auth).expect(200);

    const res = await http
      .get(`/v1/orders/${created.body.id}`).set("Authorization", otherAuth).expect(404);
    expect(res.body.code).toBe(ApiErrorCode.NOT_FOUND);
    // Khong lo PII cua don.
    expect(JSON.stringify(res.body)).not.toContain(recipient.phone);
  });
});
