/**
 * Display formatting helpers.
 */

/**
 * formatQty — the single source of truth for showing a quantity with its unit
 * (PROJECT.md §13a, §21, business rule 12). Used EVERYWHERE a quantity appears
 * so pluralization and spacing stay consistent.
 *
 *   formatQty(1, "strip")  -> "1 strip"
 *   formatQty(22, "strip") -> "22 strips"
 *   formatQty(3, "bottle") -> "3 bottles"
 *   formatQty(1, "box")    -> "1 box"
 *
 * Simple English pluralization is enough for the unit vocabulary we use.
 */
export function formatQty(quantity: number, unit: string): string {
  const u = (unit || "").trim();
  if (!u) return String(quantity);
  const plural = quantity === 1 ? u : pluralize(u);
  return `${quantity} ${plural}`;
}

function pluralize(unit: string): string {
  const lower = unit.toLowerCase();
  // e.g. "box" -> "boxes", "patch" -> "patches"
  if (/(s|x|z|ch|sh)$/.test(lower)) return `${unit}es`;
  // e.g. "vial" stays, "strip" -> "strips"
  return `${unit}s`;
}

/** Initials for an avatar bubble, e.g. "Uncle A" -> "UA". */
export function initials(name: string | null | undefined): string {
  if (!name) return "•";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "•";
}
