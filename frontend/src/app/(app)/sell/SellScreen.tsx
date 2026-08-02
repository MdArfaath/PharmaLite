"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { RecentlySold } from "@/components/sell/RecentlySold";
import { SellSearch } from "@/components/sell/SellSearch";
import { CartSheet } from "@/components/sell/CartSheet";
import { useCartStore } from "@/features/sell/store";
import { useRecordSale } from "@/features/sell/queries";
import { formatMoney } from "@/lib/utils/money";
import { ROUTES } from "@/lib/constants";

export function SellScreen() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const totalPaise = useCartStore((s) => s.totalPaise());
  const totalUnits = useCartStore((s) => s.totalUnits());
  const clear = useCartStore((s) => s.clear);

  const recordSale = useRecordSale();
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (lines.length === 0) return;
    setSubmitting(true);
    try {
      await recordSale.mutateAsync({ lines });
      clear();
      setSubmitting(false);
      setCartOpen(false);
      toast.success(`Sale complete · ${formatMoney(totalPaise)}`);
      router.refresh();
    } catch (err) {
      setSubmitting(false);
      // Surface the DB's message (e.g. "Not enough stock for X").
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Couldn't complete the sale. Please try again.";
      toast.error(message);
    }
  }

  const hasItems = lines.length > 0;

  return (
    <div className="space-y-5 pb-20">
      <RecentlySold />
      <SellSearch />

      {/* Sticky "View cart" bar — appears once the cart has items. */}
      {hasItems && (
        <div className="fixed inset-x-0 bottom-16 z-30 px-4 pb-safe-b">
          <div className="mx-auto max-w-md">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl bg-brand-600 px-5 py-3 text-white shadow-lg hover:bg-brand-700 active:scale-[0.99]"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <span className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand-700">
                    {totalUnits}
                  </span>
                </span>
                View cart
              </span>
              <span className="font-semibold">{formatMoney(totalPaise)}</span>
            </button>
          </div>
        </div>
      )}

      <CartSheet
        open={cartOpen}
        submitting={submitting}
        onClose={() => setCartOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
