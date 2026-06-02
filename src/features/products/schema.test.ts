import { describe, it, expect } from "vitest";
import { productSchema } from "./schema";

describe("productSchema", () => {
  const valid = { name: "Camisola Personalizada", salePrice: 29.99 };

  it("accepts valid product", () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts product with description", () => {
    expect(productSchema.safeParse({ ...valid, description: "Algodão 100%" }).success).toBe(true);
  });

  it("description is optional", () => {
    const result = productSchema.safeParse({ name: "Produto", salePrice: 10 });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = productSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = productSchema.safeParse({ ...valid, salePrice: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts zero price", () => {
    expect(productSchema.safeParse({ ...valid, salePrice: 0 }).success).toBe(true);
  });

  it("rejects non-numeric price", () => {
    const result = productSchema.safeParse({ ...valid, salePrice: "free" });
    expect(result.success).toBe(false);
  });
});
