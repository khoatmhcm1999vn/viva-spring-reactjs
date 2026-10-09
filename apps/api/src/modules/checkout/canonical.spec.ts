import { canonicalizeQuote, normalizeNote } from "@coffee-order/contracts";

describe("normalizeNote", () => {
  it("trim va gom khoang trang", () => {
    expect(normalizeNote("  it  ngot   giup minh ")).toBe("it ngot giup minh");
  });
  it("rong hoac chi khoang trang -> null", () => {
    expect(normalizeNote("   ")).toBeNull();
    expect(normalizeNote("")).toBeNull();
    expect(normalizeNote(null)).toBeNull();
    expect(normalizeNote(undefined)).toBeNull();
  });
  it("gom ca xuong dong", () => {
    expect(normalizeNote("a\n\nb")).toBe("a b");
  });
});

describe("canonicalizeQuote", () => {
  const base = {
    storeId: "s1",
    fulfillmentType: "PICKUP",
    paymentMethod: "PAY_AT_COUNTER",
    recipient: { name: "Minh", phone: "0901234567" },
    items: [
      { variantId: "v1", quantity: 2, modifierOptionIds: ["o2", "o1"], note: "  it ngot " },
    ],
  };

  it("thu tu modifierOptionIds khong anh huong hash", () => {
    const a = canonicalizeQuote(base);
    const b = canonicalizeQuote({
      ...base,
      items: [{ ...base.items[0]!, modifierOptionIds: ["o1", "o2"] }],
    });
    expect(a).toBe(b);
  });

  it("thu tu items khong anh huong hash", () => {
    const two = {
      ...base,
      items: [
        { variantId: "v1", quantity: 1, modifierOptionIds: [], note: null },
        { variantId: "v2", quantity: 1, modifierOptionIds: [], note: null },
      ],
    };
    const swapped = { ...two, items: [two.items[1]!, two.items[0]!] };
    expect(canonicalizeQuote(two)).toBe(canonicalizeQuote(swapped));
  });

  it("note khac nhau -> hash khac (khong gom dong)", () => {
    const a = canonicalizeQuote(base);
    const b = canonicalizeQuote({
      ...base,
      items: [{ ...base.items[0]!, note: "nhieu da" }],
    });
    expect(a).not.toBe(b);
  });

  it("note chi khac khoang trang -> hash giong (da normalize)", () => {
    const a = canonicalizeQuote(base);
    const b = canonicalizeQuote({
      ...base,
      items: [{ ...base.items[0]!, note: "it   ngot" }],
    });
    expect(a).toBe(b);
  });

  it("recipient duoc trim", () => {
    const a = canonicalizeQuote(base);
    const b = canonicalizeQuote({ ...base, recipient: { name: " Minh ", phone: " 0901234567 " } });
    expect(a).toBe(b);
  });
});
