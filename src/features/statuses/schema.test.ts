import { describe, it, expect } from "vitest";
import { statusSchema } from "./schema";

describe("statusSchema", () => {
  const valid = { name: "Em Progresso", color: "#f59e0b" };

  it("accepts valid status", () => {
    expect(statusSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts all 6-digit hex colors", () => {
    for (const color of ["#000000", "#ffffff", "#3b82f6", "#AABBCC"]) {
      expect(statusSchema.safeParse({ ...valid, color }).success).toBe(true);
    }
  });

  it("rejects empty name", () => {
    expect(statusSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects color without hash", () => {
    expect(statusSchema.safeParse({ ...valid, color: "ff0000" }).success).toBe(false);
  });

  it("rejects 3-digit hex color", () => {
    expect(statusSchema.safeParse({ ...valid, color: "#fff" }).success).toBe(false);
  });

  it("rejects non-hex color", () => {
    expect(statusSchema.safeParse({ ...valid, color: "red" }).success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(statusSchema.safeParse({}).success).toBe(false);
  });
});
