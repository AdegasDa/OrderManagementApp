import { describe, it, expect } from "vitest";
import { paymentTypeSchema } from "./schema";

describe("paymentTypeSchema", () => {
  it("accepts valid name", () => {
    expect(paymentTypeSchema.safeParse({ name: "MB Way" }).success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = paymentTypeSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    expect(paymentTypeSchema.safeParse({}).success).toBe(false);
  });
});
