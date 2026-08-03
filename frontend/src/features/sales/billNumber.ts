/**
 * Bill-number helper.
 *
 * The v1 schema has no invoice/bill-number column (invoices are out of scope,
 * PROJECT.md). To still give each sale a stable, human-readable reference we
 * derive one deterministically from its UUID: the first 6 hex chars, uppercased,
 * prefixed with "#". This is stable (same sale → same bill no.), unique enough
 * for a single shop's history, and needs no schema change.
 */
export function billNumber(saleId: string): string {
  const hex = saleId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `#${hex}`;
}

/** True if the user's query loosely matches a sale's derived bill number/id. */
export function matchesBillNumber(saleId: string, term: string): boolean {
  const t = term.trim().replace(/^#/, "").toLowerCase();
  if (!t) return false;
  const hex = saleId.replace(/-/g, "").toLowerCase();
  return hex.startsWith(t) || hex.slice(0, 6) === t;
}
