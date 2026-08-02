"use client";

import { useEffect, useState } from "react";

/**
 * Debounces a rapidly-changing value. Used by inventory/sell search so we query
 * the DB at most once per pause in typing (PROJECT.md §13a — fast search).
 */
export function useDebounce<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
