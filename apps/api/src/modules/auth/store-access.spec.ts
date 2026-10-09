import { ForbiddenException } from "@nestjs/common";
import type { AuthenticatedUser } from "@coffee-order/contracts";
import { StoreAccessService } from "./store-access.service";
import type { PrismaService } from "../../prisma/prisma.service";

const STORE_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const STORE_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

/** Prisma stub: STAFF chi duoc gan STORE_A. */
function makePrisma(): PrismaService {
  return {
    storeStaff: {
      findMany: async ({ where }: { where: { userId: string } }) =>
        where.userId === "staff-a" ? [{ storeId: STORE_A }] : [],
      findUnique: async ({
        where,
      }: {
        where: { storeId_userId: { storeId: string; userId: string } };
      }) => {
        const { storeId, userId } = where.storeId_userId;
        return userId === "staff-a" && storeId === STORE_A ? { storeId } : null;
      },
    },
  } as unknown as PrismaService;
}

const staffA: AuthenticatedUser = { id: "staff-a", role: "STAFF", isActive: true, email: null };
const admin: AuthenticatedUser = { id: "adm", role: "ADMIN", isActive: true, email: null };
const customer: AuthenticatedUser = { id: "cus", role: "CUSTOMER", isActive: true, email: null };

describe("StoreAccessService", () => {
  const svc = new StoreAccessService(makePrisma());

  it("STAFF thao tac store duoc gan -> cho phep", async () => {
    expect(await svc.canActForStore(staffA, STORE_A)).toBe(true);
    await expect(svc.assertCanActForStore(staffA, STORE_A)).resolves.toBeUndefined();
  });

  it("STAFF store A dung store B -> tu choi (403)", async () => {
    expect(await svc.canActForStore(staffA, STORE_B)).toBe(false);
    await expect(svc.assertCanActForStore(staffA, STORE_B)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("ADMIN thao tac moi store", async () => {
    expect(await svc.canActForStore(admin, STORE_A)).toBe(true);
    expect(await svc.canActForStore(admin, STORE_B)).toBe(true);
  });

  it("CUSTOMER khong co quyen staff o store nao", async () => {
    expect(await svc.canActForStore(customer, STORE_A)).toBe(false);
  });

  it("staffStoreIds tra dung danh sach duoc gan", async () => {
    expect(await svc.staffStoreIds("staff-a")).toEqual([STORE_A]);
    expect(await svc.staffStoreIds("cus")).toEqual([]);
  });
});
