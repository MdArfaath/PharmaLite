import { describe, it, expect } from "vitest";
import { toShopUpdate } from "./queries";
import type { ShopSettings } from "@/lib/db/types";
import type { SettingsFormValues } from "./schema";

/**
 * Tests for the pure form→UPDATE mapper. No DB needed.
 */

const existing: ShopSettings = {
  low_stock_threshold: 10,
  expiry_window_days: 30,
  currency: "INR",
};

const values: SettingsFormValues = {
  name: "  New Name  ",
  phone: "  9876543210  ",
  lowStockThreshold: 5,
  expiryWindowDays: 60,
  currency: "USD",
};

describe("toShopUpdate", () => {
  it("trims the name and phone", () => {
    const out = toShopUpdate(values, existing);
    expect(out.name).toBe("New Name");
    expect(out.phone).toBe("9876543210");
  });

  it("maps thresholds and currency into settings", () => {
    const out = toShopUpdate(values, existing);
    expect(out.settings.low_stock_threshold).toBe(5);
    expect(out.settings.expiry_window_days).toBe(60);
    expect(out.settings.currency).toBe("USD");
  });

  it("converts a blank phone to null", () => {
    const out = toShopUpdate({ ...values, phone: "   " }, existing);
    expect(out.phone).toBeNull();
  });

  it("converts an undefined phone to null", () => {
    const out = toShopUpdate(
      { ...values, phone: undefined as unknown as string },
      existing,
    );
    expect(out.phone).toBeNull();
  });

  it("preserves unmanaged keys already present in settings", () => {
    const extended = { ...existing, some_future_flag: true } as ShopSettings & {
      some_future_flag: boolean;
    };
    const out = toShopUpdate(values, extended);
    expect((out.settings as { some_future_flag?: boolean }).some_future_flag).toBe(
      true,
    );
  });
});
