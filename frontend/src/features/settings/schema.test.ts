import { describe, it, expect } from "vitest";
import { settingsFormSchema } from "./schema";

/**
 * Schema validation tests for editable shop settings.
 */

const valid = {
  name: "City Medical",
  phone: "+91 98765 43210",
  lowStockThreshold: 10,
  expiryWindowDays: 30,
  currency: "INR",
};

describe("settingsFormSchema", () => {
  it("accepts a fully valid payload", () => {
    const r = settingsFormSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("allows a blank phone", () => {
    const r = settingsFormSchema.safeParse({ ...valid, phone: "" });
    expect(r.success).toBe(true);
  });

  it("rejects a too-short shop name", () => {
    const r = settingsFormSchema.safeParse({ ...valid, name: "A" });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    const r = settingsFormSchema.safeParse({ ...valid, phone: "abc" });
    expect(r.success).toBe(false);
  });

  it("coerces numeric strings for thresholds", () => {
    const r = settingsFormSchema.safeParse({
      ...valid,
      lowStockThreshold: "15",
      expiryWindowDays: "45",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.lowStockThreshold).toBe(15);
      expect(r.data.expiryWindowDays).toBe(45);
    }
  });

  it("rejects a negative low-stock threshold", () => {
    const r = settingsFormSchema.safeParse({ ...valid, lowStockThreshold: -1 });
    expect(r.success).toBe(false);
  });

  it("rejects a non-integer threshold", () => {
    const r = settingsFormSchema.safeParse({ ...valid, lowStockThreshold: 2.5 });
    expect(r.success).toBe(false);
  });

  it("rejects an expiry window below 1", () => {
    const r = settingsFormSchema.safeParse({ ...valid, expiryWindowDays: 0 });
    expect(r.success).toBe(false);
  });

  it("rejects an expiry window above 365", () => {
    const r = settingsFormSchema.safeParse({ ...valid, expiryWindowDays: 400 });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown currency", () => {
    const r = settingsFormSchema.safeParse({ ...valid, currency: "XYZ" });
    expect(r.success).toBe(false);
  });
});
