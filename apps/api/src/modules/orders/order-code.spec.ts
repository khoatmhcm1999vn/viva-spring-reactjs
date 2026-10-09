import { generateOrderCode } from "./order-code";

describe("generateOrderCode", () => {
  it("dung dinh dang CF-YYMMDD-XXXX", () => {
    expect(generateOrderCode(new Date("2026-10-09T03:00:00Z"))).toMatch(
      /^CF-\d{6}-[0-9A-HJKMNP-TV-Z]{4}$/,
    );
  });

  it("YYMMDD theo gio Viet Nam (UTC+7)", () => {
    // 2026-10-09T18:30Z = 2026-10-10 01:30 gio VN -> phai la 261010.
    expect(generateOrderCode(new Date("2026-10-09T18:30:00Z")).slice(3, 9)).toBe("261010");
    // 2026-10-09T10:00Z = 2026-10-09 17:00 gio VN -> 261009.
    expect(generateOrderCode(new Date("2026-10-09T10:00:00Z")).slice(3, 9)).toBe("261009");
  });

  it("khong dung ky tu de nham (I, L, O, U)", () => {
    for (let i = 0; i < 200; i++) {
      const suffix = generateOrderCode().slice(-4);
      expect(suffix).not.toMatch(/[ILOU]/);
    }
  });

  it("sinh ngau nhien: 200 lan khong trung het", () => {
    const now = new Date("2026-10-09T03:00:00Z");
    const codes = new Set(Array.from({ length: 200 }, () => generateOrderCode(now)));
    // 32^4 ~ 1M kha nang nen 200 mau gan nhu khong trung.
    expect(codes.size).toBeGreaterThan(190);
  });
});
