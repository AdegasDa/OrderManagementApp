import { describe, it, expect } from "vitest";
import { orderSchema } from "./schema";

const valid = {
  orderDate: "2026-06-01",
  clientId: "client_abc123",
  productId: "product_abc123",
  paymentTypeId: "payment_abc123",
  statusId: "status_abc123",
  totalValue: 50,
  advanceAmount: 10,
  notes: "Entregar até dia 10",
  deliveryNotes: "Chamar antes de entregar",
};

describe("orderSchema", () => {
  it("accepts a fully valid order", () => {
    expect(orderSchema.safeParse(valid).success).toBe(true);
  });

  it("notes and deliveryNotes are optional", () => {
    const { notes: _n, deliveryNotes: _d, ...withoutNotes } = valid;
    expect(orderSchema.safeParse(withoutNotes).success).toBe(true);
  });

  it("advanceAmount defaults to 0 when omitted", () => {
    const { advanceAmount: _a, ...without } = valid;
    const result = orderSchema.safeParse(without);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.advanceAmount).toBe(0);
  });

  it("rejects empty orderDate", () => {
    expect(orderSchema.safeParse({ ...valid, orderDate: "" }).success).toBe(false);
  });

  it("rejects empty clientId", () => {
    expect(orderSchema.safeParse({ ...valid, clientId: "" }).success).toBe(false);
  });

  it("rejects empty productId", () => {
    expect(orderSchema.safeParse({ ...valid, productId: "" }).success).toBe(false);
  });

  it("rejects empty paymentTypeId", () => {
    expect(orderSchema.safeParse({ ...valid, paymentTypeId: "" }).success).toBe(false);
  });

  it("rejects empty statusId", () => {
    expect(orderSchema.safeParse({ ...valid, statusId: "" }).success).toBe(false);
  });

  it("rejects negative totalValue", () => {
    expect(orderSchema.safeParse({ ...valid, totalValue: -1 }).success).toBe(false);
  });

  it("rejects negative advanceAmount", () => {
    expect(orderSchema.safeParse({ ...valid, advanceAmount: -5 }).success).toBe(false);
  });

  it("accepts zero values", () => {
    expect(orderSchema.safeParse({ ...valid, totalValue: 0, advanceAmount: 0 }).success).toBe(true);
  });

  it("rejects non-numeric totalValue", () => {
    expect(orderSchema.safeParse({ ...valid, totalValue: "grátis" }).success).toBe(false);
  });
});
