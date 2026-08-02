"use client";

import { create } from "zustand";
import type { Medicine } from "@/lib/db/types";

/**
 * The in-progress sale "cart" (PROJECT.md §14 — ephemeral client state in
 * Zustand, not server state). Holds line items until the user confirms, at
 * which point the Sell screen calls the record_sale RPC. Each line snapshots
 * the medicine's name/unit/price/available stock at add-time for display and
 * client-side over-sell guarding; the DB re-validates authoritative stock.
 */

export interface CartLine {
  medicineId: string;
  name: string;
  unit: string;
  unitPricePaise: number;
  available: number; // on-hand at add time (client-side guard only)
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  addItem: (medicine: Medicine, qty?: number) => void;
  setQty: (medicineId: string, qty: number) => void;
  increment: (medicineId: string) => void;
  decrement: (medicineId: string) => void;
  removeItem: (medicineId: string) => void;
  clear: () => void;
  totalPaise: () => number;
  totalUnits: () => number;
}

/** Clamp a quantity to [0, available]. */
function clamp(qty: number, available: number): number {
  if (!Number.isFinite(qty)) return 0;
  const n = Math.trunc(qty);
  if (n < 0) return 0;
  if (n > available) return available;
  return n;
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],

  addItem: (medicine, qty = 1) =>
    set((state) => {
      const existing = state.lines.find((l) => l.medicineId === medicine.id);
      if (existing) {
        const next = clamp(existing.quantity + qty, medicine.quantity);
        return {
          lines: state.lines.map((l) =>
            l.medicineId === medicine.id
              ? { ...l, quantity: next, available: medicine.quantity }
              : l,
          ),
        };
      }
      // Don't add out-of-stock medicines.
      if (medicine.quantity <= 0) return state;
      const line: CartLine = {
        medicineId: medicine.id,
        name: medicine.name,
        unit: medicine.unit,
        unitPricePaise: medicine.selling_price_paise,
        available: medicine.quantity,
        quantity: clamp(qty, medicine.quantity),
      };
      return { lines: [...state.lines, line] };
    }),

  setQty: (medicineId, qty) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.medicineId === medicineId
          ? { ...l, quantity: clamp(qty, l.available) }
          : l,
      ),
    })),

  increment: (medicineId) => {
    const line = get().lines.find((l) => l.medicineId === medicineId);
    if (line) get().setQty(medicineId, line.quantity + 1);
  },

  decrement: (medicineId) => {
    const line = get().lines.find((l) => l.medicineId === medicineId);
    if (!line) return;
    const next = line.quantity - 1;
    if (next <= 0) get().removeItem(medicineId);
    else get().setQty(medicineId, next);
  },

  removeItem: (medicineId) =>
    set((state) => ({
      lines: state.lines.filter((l) => l.medicineId !== medicineId),
    })),

  clear: () => set({ lines: [] }),

  totalPaise: () =>
    get().lines.reduce((sum, l) => sum + l.unitPricePaise * l.quantity, 0),

  totalUnits: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
}));
