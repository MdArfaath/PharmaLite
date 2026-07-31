/**
 * Money helpers. All money is stored as integer paise (PROJECT.md §6, §22).
 * Never use floats for money math.
 */

/** Convert integer paise to a display string, e.g. 10600 -> "₹106.00". */
export function formatMoney(paise: number, currencySymbol = "₹"): string {
  const rupees = paise / 100;
  return `${currencySymbol}${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Parse a rupee input string/number into integer paise. Returns 0 for blanks. */
export function rupeesToPaise(input: string | number): number {
  const n = typeof input === "number" ? input : parseFloat(input);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

/** Convert integer paise back to a rupee number (for prefilling inputs). */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}
