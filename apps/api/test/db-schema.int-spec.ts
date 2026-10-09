/**
 * Integration test cho schema/migration tren PostgreSQL that.
 *
 * CHI chay khi TEST_DATABASE_URL duoc dat. Khong co thi toan bo suite bi skip,
 * de `pnpm test` tren may chua co DB khong fail (yeu cau cua steering buoc 04).
 *
 * Guard an toan: tu choi chay neu URL co ve tro production, va tu choi neu URL
 * trung voi DATABASE_URL (DB dev) - test se TRUNCATE du lieu nen phai la DB rieng.
 *
 * Cach chay (DB test o cong 5435 do infra/compose.dev.yml tao):
 *   $env:TEST_DATABASE_URL="postgresql://coffee:coffee_test_pw@localhost:5435/coffee_order_test?schema=public"
 *   pnpm --filter @coffee-order/api run test:int
 */
import { execFileSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const TEST_URL = process.env.TEST_DATABASE_URL;
const DEV_URL = process.env.DATABASE_URL;

const describeIfDb = TEST_URL ? describe : describe.skip;

describeIfDb("schema integration (PostgreSQL that)", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    if (!TEST_URL) return;
    if (/prod/i.test(TEST_URL)) {
      throw new Error("TEST_DATABASE_URL co ve tro production. Tu choi.");
    }
    if (DEV_URL && TEST_URL === DEV_URL) {
      throw new Error("TEST_DATABASE_URL trung DATABASE_URL (DB dev). Can DB test rieng.");
    }

    // Ap migration len DB test tu dau. `migrate reset --force` xoa va dung lai
    // toan bo schema - an toan vi guard o tren da chan dev/prod.
    // Chi dinh --schema tuong minh vi subprocess khong chac load prisma.config.ts.
    execFileSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "reset", "--force"],
      { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: TEST_URL }, stdio: "pipe" },
    );

    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: TEST_URL }) });
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
  });

  async function seedStoreAndVariant() {
    const store = await prisma.store.create({
      data: { code: "T-STORE", name: "Test store", address: "test" },
    });
    const category = await prisma.category.create({
      data: { name: "Cat", slug: "cat-" + Date.now() },
    });
    const product = await prisma.product.create({
      data: { name: "P", slug: "p-" + Date.now(), categoryId: category.id },
    });
    const variant = await prisma.productVariant.create({
      data: { sku: "SKU-" + Date.now(), size: "M", priceVnd: 35000, productId: product.id },
    });
    return { store, category, product, variant };
  }

  it("migrate tao duoc schema: dem bang rong tra 0", async () => {
    const stores = await prisma.store.count();
    expect(stores).toBe(0);
  });

  it("CHECK: variant price_vnd am bi tu choi", async () => {
    const category = await prisma.category.create({
      data: { name: "C", slug: "neg-" + Date.now() },
    });
    const product = await prisma.product.create({
      data: { name: "P", slug: "pneg-" + Date.now(), categoryId: category.id },
    });
    await expect(
      prisma.productVariant.create({
        data: { sku: "NEG-" + Date.now(), size: "M", priceVnd: -1, productId: product.id },
      }),
    ).rejects.toThrow();
  });

  it("CHECK: modifier group max < min bi tu choi", async () => {
    await expect(
      prisma.modifierGroup.create({ data: { name: "bad", minSelect: 2, maxSelect: 1 } }),
    ).rejects.toThrow();
  });

  it("UNIQUE: hai variant cung (product,size) bi tu choi", async () => {
    const category = await prisma.category.create({
      data: { name: "C", slug: "uq-" + Date.now() },
    });
    const product = await prisma.product.create({
      data: { name: "P", slug: "puq-" + Date.now(), categoryId: category.id },
    });
    await prisma.productVariant.create({
      data: { sku: "A-" + Date.now(), size: "M", priceVnd: 1000, productId: product.id },
    });
    await expect(
      prisma.productVariant.create({
        data: { sku: "B-" + Date.now(), size: "M", priceVnd: 2000, productId: product.id },
      }),
    ).rejects.toThrow();
  });

  it("FK RESTRICT: xoa category con san pham bi tu choi", async () => {
    const category = await prisma.category.create({
      data: { name: "C", slug: "fk-" + Date.now() },
    });
    await prisma.product.create({
      data: { name: "P", slug: "pfk-" + Date.now(), categoryId: category.id },
    });
    await expect(prisma.category.delete({ where: { id: category.id } })).rejects.toThrow();
  });

  it("CHECK: order total != subtotal+shipping-discount bi tu choi", async () => {
    const { store, variant } = await seedStoreAndVariant();
    const user = await prisma.profile.create({
      data: { id: crypto.randomUUID(), fullName: "U", role: "CUSTOMER" },
    });
    const quote = await prisma.checkoutQuote.create({
      data: {
        userId: user.id,
        storeId: store.id,
        requestHash: "h",
        normalizedPayload: {},
        priceSnapshot: {},
        totalVnd: 35000,
        expiresAt: new Date(Date.now() + 300000),
      },
    });
    await expect(
      prisma.order.create({
        data: {
          code: "ORD-" + Date.now(),
          userId: user.id,
          storeId: store.id,
          quoteId: quote.id,
          subtotalVnd: 35000,
          shippingFeeVnd: 0,
          discountVnd: 0,
          totalVnd: 99999, // sai cong thuc -> CHECK tu choi
          recipientName: "A",
          recipientPhone: "0900000000",
          storeNameSnapshot: store.name,
          storeAddressSnapshot: store.address,
        },
      }),
    ).rejects.toThrow();
    // tranh unused var khi variant khong dung truc tiep
    expect(variant.priceVnd).toBe(35000);
  });

  it("rollback: loi giua transaction khong de lai du lieu mo coi", async () => {
    const before = await prisma.category.count();
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.category.create({ data: { name: "Rollback", slug: "rb-" + Date.now() } });
        throw new Error("loi inject giua transaction");
      }),
    ).rejects.toThrow("loi inject");
    const after = await prisma.category.count();
    expect(after).toBe(before); // category tao trong tx da bi rollback
  });
});
