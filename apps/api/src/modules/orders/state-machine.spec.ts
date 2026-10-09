import {
  ORDER_TRANSITIONS,
  OrderStatus,
  canCollectPayment,
  canTransition,
  isTerminalOrderStatus,
} from "@coffee-order/contracts";

describe("do thi chuyen trang thai don", () => {
  it("duong tien dan pickup hop le", () => {
    expect(canTransition("PLACED", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "PREPARING")).toBe(true);
    expect(canTransition("PREPARING", "READY")).toBe(true);
    expect(canTransition("READY", "COMPLETED")).toBe(true);
  });

  it("ket thuc som chi tu PLACED", () => {
    expect(canTransition("PLACED", "CANCELLED")).toBe(true);
    expect(canTransition("PLACED", "REJECTED")).toBe(true);
    for (const from of ["CONFIRMED", "PREPARING", "READY"] as const) {
      expect(canTransition(from, "CANCELLED")).toBe(false);
      expect(canTransition(from, "REJECTED")).toBe(false);
    }
  });

  it("khong bo buoc", () => {
    expect(canTransition("PLACED", "PREPARING")).toBe(false);
    expect(canTransition("PLACED", "READY")).toBe(false);
    expect(canTransition("PLACED", "COMPLETED")).toBe(false);
    expect(canTransition("CONFIRMED", "READY")).toBe(false);
    expect(canTransition("PREPARING", "COMPLETED")).toBe(false);
  });

  it("khong lui buoc", () => {
    expect(canTransition("CONFIRMED", "PLACED")).toBe(false);
    expect(canTransition("PREPARING", "CONFIRMED")).toBe(false);
    expect(canTransition("READY", "PREPARING")).toBe(false);
    expect(canTransition("COMPLETED", "READY")).toBe(false);
  });

  it("trang thai terminal khong co duong ra", () => {
    for (const s of ["COMPLETED", "CANCELLED", "REJECTED"] as const) {
      expect(isTerminalOrderStatus(s)).toBe(true);
      expect(ORDER_TRANSITIONS[s]).toHaveLength(0);
    }
  });

  it("trang thai dang chay khong phai terminal", () => {
    for (const s of ["PLACED", "CONFIRMED", "PREPARING", "READY"] as const) {
      expect(isTerminalOrderStatus(s)).toBe(false);
    }
  });

  it("moi trang thai dich deu nam trong enum OrderStatus", () => {
    const valid = new Set(Object.values(OrderStatus));
    for (const [, tos] of Object.entries(ORDER_TRANSITIONS)) {
      for (const to of tos) expect(valid.has(to)).toBe(true);
    }
  });

  it("DELIVERY khong co trong do thi MVP (OUT_FOR_DELIVERY chua bat)", () => {
    const all = Object.values(ORDER_TRANSITIONS).flat();
    expect(all).not.toContain("OUT_FOR_DELIVERY");
  });
});

describe("dieu kien thu tien", () => {
  it("chi thu tien khi READY", () => {
    expect(canCollectPayment("READY")).toBe(true);
    for (const s of ["PLACED", "CONFIRMED", "PREPARING", "COMPLETED", "CANCELLED", "REJECTED"] as const) {
      expect(canCollectPayment(s)).toBe(false);
    }
  });

  it("PLACED khong thu duoc tien -> huy/tu choi khong sinh hoan tien", () => {
    // Bat bien: huy/tu choi chi xay ra o PLACED (xem do thi) va PLACED khong
    // the thu tien -> khong ton tai don da PAID bi huy.
    expect(canCollectPayment("PLACED")).toBe(false);
    expect(canTransition("PLACED", "CANCELLED")).toBe(true);
    expect(canTransition("PLACED", "REJECTED")).toBe(true);
  });
});
