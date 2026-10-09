/**
 * Integration test xu ly don + tracking (bước 09) qua HTTP + PostgreSQL that.
 * CHI chay khi TEST_DATABASE_URL duoc dat; khong co thi skip.
 *
 * Phu checklist steering: transition sai -> 409, store scope, hai staff dua
 * cap nhat, thu tien lap, unpaid completion, thu tu history, terminal.
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

describeIfDb("tracking integration", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<typeof request>;

  const CUSTOMER = randomUUID();
  const OTHER_CUSTOMER = randomUUID();
  const STAFF_A = randomUUID();
  const STAFF_B = randomUUID();
  const ADMIN = randomUUID();
  let custAuth: string;
  let otherAuth: string;
  let staffAAuth: string;
  let staffBAuth: string;
  let adminAuth: string;

  let storeAId: string;
  let storeBId: string;
  let variantId: string;
  let daBtId: string;

  const recipient = { name: "Nguyen Van Minh", phone: "0901234567" };

  function cartFor(storeId: string) {
    return {
      storeId,
      fulfillmentType: "PICKUP" as const,
      paymentMethod: "PAY_AT_COUNTER" as const,
      recipient,
      items: [{ variantId, quantity: 1, modifierOptionIds: [daBtId], note: null }],
    };
  }

  /** Tao mot don moi o trang thai PLACED, tra ve body cua don. */
  async function placeOrder(storeId = storeAId, auth = custAuth) {
    const cart = cartFor(storeId);
    const q = await http.post("/v1/checkout/quote").set("Authorization", auth).send(cart).expect(200);
    const res = await http
      .post("/v1/orders")
      .set("Authorization", auth)
      .set("Idempotency-Key", randomUUID())
      .send({ quoteId: q.body.quoteId, ...cart })
      .expect(201);
    return res.body;
  }

  /** Day don len mot trang thai bang cac transition hop le cua staff. */
  async function advanceTo(orderId: string, target: string, auth = staffAAuth) {
    const path = ["CONFIRMED", "PREPARING", "READY"];
    let current = await http.get(`/v1/orders/${orderId}`).set("Authorization", auth);
    for (const step of path) {
      if (current.body.status === target) break;
      const res = await http
        .post(`/v1/staff/orders/${orderId}/transitions`)
        .set("Authorization", auth)
        .send({ toStatus: step, expectedVersion: current.body.version })
        .expect(200);
      current = res;
      if (step === target) break;
    }
    return current.body;
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

    await prisma.profile.createMany({
      data: [
        { id: CUSTOMER, role: "CUSTOMER", fullName: "Khach Minh" },
        { id: OTHER_CUSTOMER, role: "CUSTOMER", fullName: "Khach Khac" },
        { id: STAFF_A, role: "STAFF", fullName: "Hung Store A" },
        { id: STAFF_B, role: "STAFF", fullName: "Mai Store B" },
        { id: ADMIN, role: "ADMIN", fullName: "Admin Demo" },
      ],
    });
    custAuth = `Bearer ${await token(CUSTOMER)}`;
    otherAuth = `Bearer ${await token(OTHER_CUSTOMER)}`;
    staffAAuth = `Bearer ${await token(STAFF_A)}`;
    staffBAuth = `Bearer ${await token(STAFF_B)}`;
    adminAuth = `Bearer ${await token(ADMIN)}`;

    const a = await prisma.store.create({ data: { code: "SA", name: "Store A", address: "a" } });
    const b = await prisma.store.create({ data: { code: "SB", name: "Store B", address: "b" } });
    storeAId = a.id;
    storeBId = b.id;
    await prisma.storeStaff.create({ data: { storeId: a.id, userId: STAFF_A } });
    await prisma.storeStaff.create({ data: { storeId: b.id, userId: STAFF_B } });

    const cat = await prisma.category.create({ data: { name: "Ca phe", slug: "ca-phe" } });
    const product = await prisma.product.create({
      data: { name: "Ca phe sua da", slug: "cf-sua-da", categoryId: cat.id },
    });
    const v = await prisma.productVariant.create({
      data: { productId: product.id, sku: "CF-M", size: "M", priceVnd: 35000 },
    });
    variantId = v.id;
    await prisma.storeVariant.createMany({
      data: [
        { storeId: a.id, variantId: v.id, isAvailable: true },
        { storeId: b.id, variantId: v.id, isAvailable: true },
      ],
    });
    const groupDa = await prisma.modifierGroup.create({
      data: { name: "Muc da", minSelect: 1, maxSelect: 1 },
    });
    const daBt = await prisma.modifierOption.create({
      data: { groupId: groupDa.id, name: "Da binh thuong", extraPriceVnd: 0 },
    });
    daBtId = daBt.id;
    await prisma.productModifierGroup.create({
      data: { productId: product.id, groupId: groupDa.id },
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  /* ===================== Luong chinh ===================== */

  it("luong day du PLACED -> CONFIRMED -> PREPARING -> READY -> thu tien -> COMPLETED", async () => {
    const order = await placeOrder();
    expect(order.status).toBe("PLACED");
    expect(order.version).toBe(0);

    let cur = order;
    for (const step of ["CONFIRMED", "PREPARING", "READY"]) {
      const res = await http
        .post(`/v1/staff/orders/${order.id}/transitions`)
        .set("Authorization", staffAAuth)
        .send({ toStatus: step, expectedVersion: cur.version })
        .expect(200);
      expect(res.body.status).toBe(step);
      expect(res.body.version).toBe(cur.version + 1);
      cur = res.body;
    }

    // Chua thu tien -> khong hoan tat duoc (REQ-407).
    const unpaid = await http
      .post(`/v1/staff/orders/${order.id}/transitions`)
      .set("Authorization", staffAAuth)
      .send({ toStatus: "COMPLETED", expectedVersion: cur.version })
      .expect(409);
    expect(unpaid.body.code).toBe(ApiErrorCode.INVALID_TRANSITION);

    // Thu tien o READY.
    const paid = await http
      .post(`/v1/staff/orders/${order.id}/payments`)
      .set("Authorization", staffAAuth)
      .send({ expectedPaymentVersion: cur.payment.version })
      .expect(200);
    expect(paid.body.payment.status).toBe("PAID");
    expect(paid.body.payment.paidAt).not.toBeNull();
    expect(paid.body.payment.version).toBe(cur.payment.version + 1);
    // Audit: collected_by duoc ghi.
    const pay = await prisma.payment.findFirst({ where: { orderId: order.id } });
    expect(pay!.collectedBy).toBe(STAFF_A);

    // Gio hoan tat duoc.
    const done = await http
      .post(`/v1/staff/orders/${order.id}/transitions`)
      .set("Authorization", staffAAuth)
      .send({ toStatus: "COMPLETED", expectedVersion: paid.body.version })
      .expect(200);
    expect(done.body.status).toBe("COMPLETED");

    // Terminal: khong chuyen tiep duoc nua.
    const after = await http
      .post(`/v1/staff/orders/${order.id}/transitions`)
      .set("Authorization", staffAAuth)
      .send({ toStatus: "READY", expectedVersion: done.body.version })
      .expect(409);
    expect(after.body.code).toBe(ApiErrorCode.INVALID_TRANSITION);
  });

  /* ===================== Transition sai ===================== */

  it("bo buoc (PLACED -> READY) -> 409 INVALID_TRANSITION", async () => {
    const order = await placeOrder();
    const res = await http
      .post(`/v1/staff/orders/${order.id}/transitions`)
      .set("Authorization", staffAAuth)
      .send({ toStatus: "READY", expectedVersion: order.version })
      .expect(409);
    expect(res.body.code).toBe(ApiErrorCode.INVALID_TRANSITION);
  });

  it("lui buoc (PREPARING -> CONFIRMED) -> 409", async () => {
    const order = await placeOrder();
    const ready = await advanceTo(order.id, "PREPARING");
    const res = await http
      .post(`/v1/staff/orders/${order.id}/transitions`)
      .set("Authorization", staffAAuth)
      .send({ toStatus: "CONFIRMED", expectedVersion: ready.version })
      .expect(409);
    expect(res.body.code).toBe(ApiErrorCode.INVALID_TRANSITION);
  });

  it("expectedVersion sai -> 409 VERSION_CONFLICT", async () => {
    const order = await placeOrder();
    const res = await http
      .post(`/v1/staff/orders/${order.id}/transitions`)
      .set("Authorization", staffAAuth)
      .send({ toStatus: "CONFIRMED", expectedVersion: order.version + 5 })
      .expect(409);
    expect(res.body.code).toBe(ApiErrorCode.VERSION_CONFLICT);
  });

  it("hai staff dua cung transition -> mot 200, mot 409, chi mot dong history", async () => {
    const order = await placeOrder();
    const body = { toStatus: "CONFIRMED", expectedVersion: order.version };
    const send = () =>
      http
        .post(`/v1/staff/orders/${order.id}/transitions`)
        .set("Authorization", staffAAuth)
        .send(body);
    const [a, b] = await Promise.all([send(), send()]);

    expect([a.status, b.status].sort()).toEqual([200, 409]);
    const loser = a.status === 409 ? a : b;
    expect(loser.body.code).toBe(ApiErrorCode.VERSION_CONFLICT);

    // Chi mot buoc CONFIRMED duoc ghi.
    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId: order.id, toStatus: "CONFIRMED" },
    });
    expect(history).toHaveLength(1);
    const fresh = await prisma.order.findUnique({ where: { id: order.id } });
    expect(fresh!.version).toBe(1);
  });

  /* ===================== REJECTED ===================== */

  it("tu choi khong co ly do -> 400; co ly do -> 200 va luu ly do", async () => {
    const order = await placeOrder();
    await http
      .post(`/v1/staff/orders/${order.id}/transitions`)
      .set("Authorization", staffAAuth)
      .send({ toStatus: "REJECTED", expectedVersion: order.version })
      .expect(400);

    const ok = await http
      .post(`/v1/staff/orders/${order.id}/transitions`)
      .set("Authorization", staffAAuth)
      .send({ toStatus: "REJECTED", expectedVersion: order.version, reason: "Het nguyen lieu" })
      .expect(200);
    expect(ok.body.status).toBe("REJECTED");

    const h = await prisma.orderStatusHistory.findFirst({
      where: { orderId: order.id, toStatus: "REJECTED" },
    });
    expect(h!.reason).toBe("Het nguyen lieu");
    expect(h!.actorId).toBe(STAFF_A);
  });

  it("tu choi khi da CONFIRMED -> 409 (chi tu choi o PLACED)", async () => {
    const order = await placeOrder();
    const confirmed = await advanceTo(order.id, "CONFIRMED");
    const res = await http
      .post(`/v1/staff/orders/${order.id}/transitions`)
      .set("Authorization", staffAAuth)
      .send({ toStatus: "REJECTED", expectedVersion: confirmed.version, reason: "x" })
      .expect(409);
    expect(res.body.code).toBe(ApiErrorCode.INVALID_TRANSITION);
  });

  /* ===================== Store scope ===================== */

  it("STAFF store B khong chuyen duoc trang thai don cua store A -> 403", async () => {
    const order = await placeOrder(storeAId);
    const res = await http
      .post(`/v1/staff/orders/${order.id}/transitions`)
      .set("Authorization", staffBAuth)
      .send({ toStatus: "CONFIRMED", expectedVersion: order.version })
      .expect(403);
    expect(res.body.code).toBe(ApiErrorCode.FORBIDDEN);
  });

  it("STAFF store B khong thu tien duoc don store A -> 403", async () => {
    const order = await placeOrder(storeAId);
    const ready = await advanceTo(order.id, "READY");
    const res = await http
      .post(`/v1/staff/orders/${order.id}/payments`)
      .set("Authorization", staffBAuth)
      .send({ expectedPaymentVersion: ready.payment.version })
      .expect(403);
    expect(res.body.code).toBe(ApiErrorCode.FORBIDDEN);
  });

  it("bang don staff chi chua don cua store duoc gan", async () => {
    await placeOrder(storeAId);
    await placeOrder(storeBId);

    const listA = await http.get("/v1/staff/orders").set("Authorization", staffAAuth).expect(200);
    expect(listA.body.items.length).toBeGreaterThan(0);
    expect(listA.body.items.every((o: { storeId: string }) => o.storeId === storeAId)).toBe(true);

    const listB = await http.get("/v1/staff/orders").set("Authorization", staffBAuth).expect(200);
    expect(listB.body.items.every((o: { storeId: string }) => o.storeId === storeBId)).toBe(true);
  });

  it("storeId tu client KHONG mo rong duoc scope: staff A loc store B -> rong", async () => {
    await placeOrder(storeBId);
    const res = await http
      .get(`/v1/staff/orders?storeId=${storeBId}`)
      .set("Authorization", staffAAuth)
      .expect(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it("ADMIN thay don cua moi store", async () => {
    await placeOrder(storeAId);
    await placeOrder(storeBId);
    const res = await http.get("/v1/staff/orders").set("Authorization", adminAuth).expect(200);
    const stores = new Set(res.body.items.map((o: { storeId: string }) => o.storeId));
    expect(stores.has(storeAId)).toBe(true);
    expect(stores.has(storeBId)).toBe(true);
  });

  it("CUSTOMER goi bang don staff -> 403", async () => {
    await http.get("/v1/staff/orders").set("Authorization", custAuth).expect(403);
  });

  it("loc theo trang thai hoat dong", async () => {
    const order = await placeOrder(storeAId);
    await advanceTo(order.id, "CONFIRMED");
    const res = await http
      .get("/v1/staff/orders?status=CONFIRMED")
      .set("Authorization", staffAAuth)
      .expect(200);
    expect(res.body.items.every((o: { status: string }) => o.status === "CONFIRMED")).toBe(true);
    expect(res.body.items.some((o: { id: string }) => o.id === order.id)).toBe(true);
  });

  /* ===================== Thu tien ===================== */

  it("thu tien khi chua READY -> 409 INVALID_TRANSITION", async () => {
    const order = await placeOrder();
    const res = await http
      .post(`/v1/staff/orders/${order.id}/payments`)
      .set("Authorization", staffAAuth)
      .send({ expectedPaymentVersion: order.payment.version })
      .expect(409);
    expect(res.body.code).toBe(ApiErrorCode.INVALID_TRANSITION);

    const confirmed = await advanceTo(order.id, "CONFIRMED");
    const res2 = await http
      .post(`/v1/staff/orders/${order.id}/payments`)
      .set("Authorization", staffAAuth)
      .send({ expectedPaymentVersion: confirmed.payment.version })
      .expect(409);
    expect(res2.body.code).toBe(ApiErrorCode.INVALID_TRANSITION);
  });

  it("thu tien lap lai -> 409, chi mot lan PAID va mot collected_by/paid_at", async () => {
    const order = await placeOrder();
    const ready = await advanceTo(order.id, "READY");

    await http
      .post(`/v1/staff/orders/${order.id}/payments`)
      .set("Authorization", staffAAuth)
      .send({ expectedPaymentVersion: ready.payment.version })
      .expect(200);

    const again = await http
      .post(`/v1/staff/orders/${order.id}/payments`)
      .set("Authorization", staffAAuth)
      .send({ expectedPaymentVersion: ready.payment.version })
      .expect(409);
    expect(again.body.code).toBe(ApiErrorCode.INVALID_TRANSITION);

    const pay = await prisma.payment.findFirst({ where: { orderId: order.id } });
    expect(pay!.status).toBe("PAID");
    expect(pay!.version).toBe(1);
    expect(pay!.collectedBy).toBe(STAFF_A);
  });

  it("hai staff dua thu tien -> mot 200, ben kia khong ghi duoc", async () => {
    const order = await placeOrder(storeAId);
    const ready = await advanceTo(order.id, "READY");
    const body = { expectedPaymentVersion: ready.payment.version };
    const send = (auth: string) =>
      http.post(`/v1/staff/orders/${order.id}/payments`).set("Authorization", auth).send(body);

    // Staff A va ADMIN (deu co quyen tren store A) cung thu tien.
    const [a, b] = await Promise.all([send(staffAAuth), send(adminAuth)]);
    const oks = [a, b].filter((r) => r.status === 200);
    expect(oks).toHaveLength(1);

    const pay = await prisma.payment.findFirst({ where: { orderId: order.id } });
    expect(pay!.status).toBe("PAID");
    expect(pay!.version).toBe(1);
  });

  /* ===================== Huy don ===================== */

  it("chu don huy khi PLACED -> 200 CANCELLED, history ghi actor la khach", async () => {
    const order = await placeOrder();
    const res = await http
      .post(`/v1/orders/${order.id}/cancel`)
      .set("Authorization", custAuth)
      .send({ expectedVersion: order.version })
      .expect(200);
    expect(res.body.status).toBe("CANCELLED");

    const h = await prisma.orderStatusHistory.findFirst({
      where: { orderId: order.id, toStatus: "CANCELLED" },
    });
    expect(h!.actorId).toBe(CUSTOMER);
  });

  it("chu don khong huy duoc sau CONFIRMED -> 409", async () => {
    const order = await placeOrder();
    const confirmed = await advanceTo(order.id, "CONFIRMED");
    const res = await http
      .post(`/v1/orders/${order.id}/cancel`)
      .set("Authorization", custAuth)
      .send({ expectedVersion: confirmed.version })
      .expect(409);
    expect(res.body.code).toBe(ApiErrorCode.INVALID_TRANSITION);
  });

  it("nguoi khac khong huy duoc don -> 404", async () => {
    const order = await placeOrder();
    const res = await http
      .post(`/v1/orders/${order.id}/cancel`)
      .set("Authorization", otherAuth)
      .send({ expectedVersion: order.version })
      .expect(404);
    expect(res.body.code).toBe(ApiErrorCode.NOT_FOUND);
    expect(JSON.stringify(res.body)).not.toContain(recipient.phone);
  });

  it("STAFF khong goi duoc endpoint cancel cua khach -> 403", async () => {
    const order = await placeOrder();
    await http
      .post(`/v1/orders/${order.id}/cancel`)
      .set("Authorization", staffAAuth)
      .send({ expectedVersion: order.version })
      .expect(403);
  });

  /* ===================== Doc / history ===================== */

  it("GET /me/orders chi tra don cua minh, co phan trang", async () => {
    await placeOrder(storeAId, custAuth);
    const res = await http.get("/v1/me/orders?limit=5").set("Authorization", custAuth).expect(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.limit).toBe(5);
    expect(typeof res.body.total).toBe("number");
    expect(res.headers["cache-control"]).toContain("no-store");

    const otherList = await http.get("/v1/me/orders").set("Authorization", otherAuth).expect(200);
    const ids = new Set(res.body.items.map((o: { id: string }) => o.id));
    expect(otherList.body.items.every((o: { id: string }) => !ids.has(o.id))).toBe(true);
  });

  it("history theo thu tu thoi gian, from_status dau tien = null", async () => {
    const order = await placeOrder();
    await advanceTo(order.id, "READY");

    const res = await http
      .get(`/v1/orders/${order.id}/history`)
      .set("Authorization", custAuth)
      .expect(200);

    expect(res.body).toHaveLength(4); // PLACED + CONFIRMED + PREPARING + READY
    expect(res.body[0].fromStatus).toBeNull();
    expect(res.body[0].toStatus).toBe("PLACED");
    expect(res.body.map((h: { toStatus: string }) => h.toStatus)).toEqual([
      "PLACED",
      "CONFIRMED",
      "PREPARING",
      "READY",
    ]);
    // Thoi gian khong giam.
    const times = res.body.map((h: { createdAt: string }) => new Date(h.createdAt).getTime());
    expect(times.every((t: number, i: number) => i === 0 || t >= times[i - 1]!)).toBe(true);
  });

  it("khach KHONG thay ten nguoi thao tac; staff thi thay", async () => {
    const order = await placeOrder();
    await advanceTo(order.id, "CONFIRMED");

    const asCustomer = await http
      .get(`/v1/orders/${order.id}/history`)
      .set("Authorization", custAuth)
      .expect(200);
    expect(asCustomer.body.every((h: { actorName: null }) => h.actorName === null)).toBe(true);

    const asStaff = await http
      .get(`/v1/orders/${order.id}/history`)
      .set("Authorization", staffAAuth)
      .expect(200);
    const confirmEntry = asStaff.body.find((h: { toStatus: string }) => h.toStatus === "CONFIRMED");
    expect(confirmEntry.actorName).toBe("Hung Store A");
    expect(confirmEntry.actorRole).toBe("STAFF");
  });

  it("staff dung store doc duoc chi tiet don; staff store khac -> 404", async () => {
    const order = await placeOrder(storeAId);
    await http.get(`/v1/orders/${order.id}`).set("Authorization", staffAAuth).expect(200);
    await http.get(`/v1/orders/${order.id}`).set("Authorization", adminAuth).expect(200);

    const res = await http.get(`/v1/orders/${order.id}`).set("Authorization", staffBAuth).expect(404);
    expect(JSON.stringify(res.body)).not.toContain(recipient.phone);
  });

  it("khach khac khong doc duoc history -> 404", async () => {
    const order = await placeOrder();
    await http.get(`/v1/orders/${order.id}/history`).set("Authorization", otherAuth).expect(404);
  });

  it("khong co endpoint PATCH tuy y field cua don", async () => {
    const order = await placeOrder();
    await http
      .patch(`/v1/orders/${order.id}`)
      .set("Authorization", custAuth)
      .send({ status: "COMPLETED" })
      .expect(404);
    await http
      .patch(`/v1/staff/orders/${order.id}`)
      .set("Authorization", staffAAuth)
      .send({ totalVnd: 1 })
      .expect(404);
  });
});
