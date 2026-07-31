/** Central route names — avoids magic strings scattered across the app. */
export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  callback: "/callback",
  dashboard: "/dashboard",
  inventory: "/inventory",
  inventoryNew: "/inventory/new",
  sell: "/sell",
  lowStock: "/alerts/low-stock",
  expiry: "/alerts/expiry",
  sales: "/sales",
  settings: "/settings",
  account: "/settings/account",
} as const;

/** Defaults mirrored from the DB shop.settings defaults (PROJECT.md §22). */
export const DEFAULT_SHOP_SETTINGS = {
  low_stock_threshold: 10,
  expiry_window_days: 30,
  currency: "INR",
} as const;

/** Sensible unit options offered when adding a medicine (PROJECT.md §13a). */
export const MEDICINE_UNITS = [
  "strip",
  "bottle",
  "tube",
  "piece",
  "sachet",
  "vial",
  "box",
  "packet",
] as const;
