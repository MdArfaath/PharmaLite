/**
 * Minimal className combiner. Filters falsy values and joins with spaces.
 * Kept dependency-free (no clsx/tailwind-merge) to stay lightweight.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
