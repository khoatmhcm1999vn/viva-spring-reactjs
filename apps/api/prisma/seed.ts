import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Seed idempotent cho DEV/demo. Chay lai nhieu lan khong nhan ban du lieu:
 * moi upsert dua tren natural key (store.code, category.slug, product.slug,
 * variant.sku, modifier_group theo ten, option theo (group,name)).
 *
 * KHONG seed profile cua staff/admin voi password/token: theo
 * .kiro/steering/04-database.md, cac tai khoan do phai duoc tao qua Supabase Auth
 * that o buoc 05. Seed chi tao du lieu catalog + mot store demo.
 *
 * Toan bo gia va ten mon la DU LIEU GIA cho demo.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Thieu DATABASE_URL. Dat trong apps/api/.env truoc khi seed.");
}

// Chan seed vao DB co ten gay nham la production.
if (/prod/i.test(connectionString)) {
  throw new Error("DATABASE_URL co ve tro toi production. Tu choi seed.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const STORE_CODE = "CO-Q1";

interface VariantSeed {
  sku: string;
  size: string;
  priceVnd: number;
}
interface ProductSeed {
  slug: string;
  name: string;
  description: string;
  variants: VariantSeed[];
  /** ten cac modifier group ap dung cho mon nay */
  groups: string[];
}
interface CategorySeed {
  slug: string;
  name: string;
  sortOrder: number;
  products: ProductSeed[];
}

// 3 nhom modifier dung chung. extraPriceVnd la integer VND.
const MODIFIER_GROUPS: {
  name: string;
  minSelect: number;
  maxSelect: number;
  options: { name: string; extraPriceVnd: number }[];
}[] = [
  {
    name: "Muc da",
    minSelect: 1,
    maxSelect: 1,
    options: [
      { name: "Da binh thuong", extraPriceVnd: 0 },
      { name: "It da", extraPriceVnd: 0 },
      { name: "Khong da", extraPriceVnd: 0 },
    ],
  },
  {
    name: "Do ngot",
    minSelect: 1,
    maxSelect: 1,
    options: [
      { name: "Ngot binh thuong", extraPriceVnd: 0 },
      { name: "It ngot", extraPriceVnd: 0 },
      { name: "Khong ngot", extraPriceVnd: 0 },
    ],
  },
  {
    name: "Topping",
    minSelect: 0,
    maxSelect: 2,
    options: [
      { name: "Thach ca phe", extraPriceVnd: 10000 },
      { name: "Kem pho mai", extraPriceVnd: 15000 },
      { name: "Tran chau", extraPriceVnd: 10000 },
    ],
  },
];

const CATEGORIES: CategorySeed[] = [
  {
    slug: "ca-phe",
    name: "Ca phe",
    sortOrder: 1,
    products: [
      {
        slug: "ca-phe-sua-da",
        name: "Ca phe sua da",
        description: "Dam, ngot vua",
        groups: ["Muc da", "Do ngot", "Topping"],
        variants: [
          { sku: "CFSD-S", size: "S", priceVnd: 29000 },
          { sku: "CFSD-M", size: "M", priceVnd: 35000 },
          { sku: "CFSD-L", size: "L", priceVnd: 45000 },
        ],
      },
      {
        slug: "ca-phe-den-da",
        name: "Ca phe den da",
        description: "Dam, khong sua",
        groups: ["Muc da", "Do ngot"],
        variants: [
          { sku: "CFDD-S", size: "S", priceVnd: 25000 },
          { sku: "CFDD-M", size: "M", priceVnd: 30000 },
        ],
      },
      {
        slug: "bac-xiu",
        name: "Bac xiu",
        description: "Nhieu sua, nhe vi ca phe",
        groups: ["Muc da", "Do ngot", "Topping"],
        variants: [
          { sku: "BX-M", size: "M", priceVnd: 35000 },
          { sku: "BX-L", size: "L", priceVnd: 45000 },
        ],
      },
      {
        slug: "cold-brew",
        name: "Cold brew",
        description: "U lanh, vi thanh",
        groups: ["Muc da", "Do ngot"],
        variants: [{ sku: "CB-M", size: "M", priceVnd: 49000 }],
      },
    ],
  },
  {
    slug: "tra",
    name: "Tra",
    sortOrder: 2,
    products: [
      {
        slug: "tra-sen-vang",
        name: "Tra sen vang",
        description: "Tra xanh uop sen",
        groups: ["Muc da", "Do ngot", "Topping"],
        variants: [
          { sku: "TSV-M", size: "M", priceVnd: 45000 },
          { sku: "TSV-L", size: "L", priceVnd: 55000 },
        ],
      },
      {
        slug: "tra-dao-cam-sa",
        name: "Tra dao cam sa",
        description: "Chua ngot, thom sa",
        groups: ["Muc da", "Do ngot", "Topping"],
        variants: [
          { sku: "TDCS-M", size: "M", priceVnd: 45000 },
          { sku: "TDCS-L", size: "L", priceVnd: 55000 },
        ],
      },
      {
        slug: "tra-vai",
        name: "Tra vai",
        description: "Ngot diu vi vai",
        groups: ["Muc da", "Do ngot", "Topping"],
        variants: [{ sku: "TV-M", size: "M", priceVnd: 45000 }],
      },
    ],
  },
  {
    slug: "da-xay",
    name: "Da xay",
    sortOrder: 3,
    products: [
      {
        slug: "da-xay-ca-phe",
        name: "Da xay ca phe",
        description: "Ca phe xay cung da",
        groups: ["Do ngot", "Topping"],
        variants: [
          { sku: "DXCF-M", size: "M", priceVnd: 55000 },
          { sku: "DXCF-L", size: "L", priceVnd: 65000 },
        ],
      },
      {
        slug: "da-xay-matcha",
        name: "Da xay matcha",
        description: "Matcha xay cung da",
        groups: ["Do ngot", "Topping"],
        variants: [{ sku: "DXMC-M", size: "M", priceVnd: 59000 }],
      },
    ],
  },
  {
    slug: "banh",
    name: "Banh",
    sortOrder: 4,
    products: [
      {
        slug: "banh-mi-cha",
        name: "Banh mi cha",
        description: "An kem ca phe",
        groups: [],
        variants: [{ sku: "BMC-ONE", size: "ONE", priceVnd: 25000 }],
      },
      {
        slug: "banh-su-kem",
        name: "Banh su kem",
        description: "Vo gion, nhan kem",
        groups: [],
        variants: [{ sku: "BSK-ONE", size: "ONE", priceVnd: 20000 }],
      },
      {
        slug: "croissant",
        name: "Croissant bo",
        description: "Nhieu lop, thom bo",
        groups: [],
        variants: [{ sku: "CRS-ONE", size: "ONE", priceVnd: 30000 }],
      },
    ],
  },
];

async function main(): Promise<void> {
  console.log("Seed bat dau. DB:", connectionString!.replace(/:[^:@/]+@/, ":***@"));

  // 1. Store demo (natural key = code)
  const store = await prisma.store.upsert({
    where: { code: STORE_CODE },
    update: { name: "Cua hang Quan 1", address: "12 Nguyen Hue, Quan 1 (dia chi gia)" },
    create: {
      code: STORE_CODE,
      name: "Cua hang Quan 1",
      address: "12 Nguyen Hue, Quan 1 (dia chi gia)",
      isActive: true,
    },
  });

  // 2. Modifier groups + options (natural key: ten group, (group,name) cho option)
  const groupIdByName = new Map<string, string>();
  for (const g of MODIFIER_GROUPS) {
    // Group khong co unique tren name trong schema, nen tim thu cong roi upsert.
    const existing = await prisma.modifierGroup.findFirst({ where: { name: g.name } });
    const group = existing
      ? await prisma.modifierGroup.update({
          where: { id: existing.id },
          data: { minSelect: g.minSelect, maxSelect: g.maxSelect },
        })
      : await prisma.modifierGroup.create({
          data: { name: g.name, minSelect: g.minSelect, maxSelect: g.maxSelect },
        });
    groupIdByName.set(g.name, group.id);

    for (const o of g.options) {
      await prisma.modifierOption.upsert({
        where: { groupId_name: { groupId: group.id, name: o.name } },
        update: { extraPriceVnd: o.extraPriceVnd, isActive: true },
        create: { groupId: group.id, name: o.name, extraPriceVnd: o.extraPriceVnd },
      });
    }
  }

  // 3. Category -> product -> variant -> store_variant + gan modifier group
  let variantCount = 0;
  let productCount = 0;
  for (const c of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder, isActive: true },
      create: { slug: c.slug, name: c.name, sortOrder: c.sortOrder },
    });

    for (const p of c.products) {
      const product = await prisma.product.upsert({
        where: { slug: p.slug },
        update: { name: p.name, description: p.description, categoryId: category.id, isActive: true },
        create: {
          slug: p.slug,
          name: p.name,
          description: p.description,
          categoryId: category.id,
        },
      });
      productCount++;

      // Gan modifier group cho product (composite PK -> idempotent)
      for (const groupName of p.groups) {
        const groupId = groupIdByName.get(groupName);
        if (!groupId) throw new Error(`Group khong ton tai: ${groupName}`);
        await prisma.productModifierGroup.upsert({
          where: { productId_groupId: { productId: product.id, groupId } },
          update: {},
          create: { productId: product.id, groupId },
        });
      }

      for (const v of p.variants) {
        const variant = await prisma.productVariant.upsert({
          where: { sku: v.sku },
          update: { size: v.size, priceVnd: v.priceVnd, productId: product.id, isActive: true },
          create: { sku: v.sku, size: v.size, priceVnd: v.priceVnd, productId: product.id },
        });
        variantCount++;

        // store_variant: mon co ban tai cua hang demo (composite PK -> idempotent)
        await prisma.storeVariant.upsert({
          where: { storeId_variantId: { storeId: store.id, variantId: variant.id } },
          update: { isAvailable: true },
          create: { storeId: store.id, variantId: variant.id, isAvailable: true },
        });
      }
    }
  }

  const [categories, products, variants, groups, options, storeVariants] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.modifierGroup.count(),
    prisma.modifierOption.count(),
    prisma.storeVariant.count(),
  ]);

  console.log("Seed xong (idempotent):");
  console.log(`  stores          : 1 (${STORE_CODE})`);
  console.log(`  categories      : ${categories}`);
  console.log(`  products        : ${products} (lan nay xu ly ${productCount})`);
  console.log(`  product_variants: ${variants} (lan nay xu ly ${variantCount})`);
  console.log(`  modifier_groups : ${groups}`);
  console.log(`  modifier_options: ${options}`);
  console.log(`  store_variants  : ${storeVariants}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed loi:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
