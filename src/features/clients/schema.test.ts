import { describe, it, expect } from "vitest";
import { clientSchema } from "./schema";

describe("clientSchema", () => {
  const valid = { name: "João Silva", phone: "+351 912 345 678", source: "STORE" as const };

  it("accepts valid client data", () => {
    expect(clientSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts all valid sources", () => {
    for (const source of ["STORE", "INSTAGRAM", "WHATSAPP"] as const) {
      expect(clientSchema.safeParse({ ...valid, source }).success).toBe(true);
    }
  });

  it("rejects empty name", () => {
    const result = clientSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
    }
  });

  it("rejects empty phone", () => {
    const result = clientSchema.safeParse({ ...valid, phone: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid source", () => {
    const result = clientSchema.safeParse({ ...valid, source: "TIKTOK" });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(clientSchema.safeParse({}).success).toBe(false);
  });
});
