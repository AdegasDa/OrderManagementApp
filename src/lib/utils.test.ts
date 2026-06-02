import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatDate } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("handles conditional objects", () => {
    expect(cn({ "font-bold": true, italic: false })).toBe("font-bold");
  });
});

describe("formatCurrency", () => {
  it("formats zero", () => {
    expect(formatCurrency(0)).toMatch(/0/);
  });

  it("formats a positive value in EUR", () => {
    const result = formatCurrency(12.5);
    expect(result).toMatch(/12/);
    expect(result).toMatch(/€|EUR/);
  });

  it("formats a large value", () => {
    const result = formatCurrency(1500);
    expect(result).toMatch(/1[.,\s]?500/);
  });

  it("formats negative values", () => {
    const result = formatCurrency(-9.99);
    expect(result).toMatch(/-/);
    expect(result).toMatch(/9/);
  });
});

describe("formatDate", () => {
  it("formats a Date object as dd/mm/yyyy", () => {
    const result = formatDate(new Date(2026, 0, 15)); // Jan 15 2026
    expect(result).toBe("15/01/2026");
  });

  it("formats a date string", () => {
    const result = formatDate("2026-06-01");
    expect(result).toBe("01/06/2026");
  });

  it("formats end-of-year date correctly", () => {
    const result = formatDate(new Date(2025, 11, 31)); // Dec 31 2025
    expect(result).toBe("31/12/2025");
  });
});
