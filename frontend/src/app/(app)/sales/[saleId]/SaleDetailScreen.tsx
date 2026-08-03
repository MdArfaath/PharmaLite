"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Ban } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LoadingState, ErrorState } from "@/components/common/States";
import { useSaleDetail, useVoidSale } from "@/features/sales/queries";
import { billNumber } from "@/features/sales/billNumber";
import { formatMoney } from "@/lib/utils/money";
import { ROUTES } from "@/lib/constants";

export function SaleDetailScreen({ saleId }: { saleId: string }) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useSaleDetail(saleId);
  const voidSale = useVoidSale(saleId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleVoid() {
    try {
      await voidSale.mutateAsync(null);
      setConfirmOpen(false);
      toast.success("Sale voided · stock restored");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Couldn't void the sale. Please try again.";
      toast.error(message);
    }
  }

  return (
    <div>
      <Link
        href={ROUTES.sales}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Sales history
      </Link>

      {isLoading ? (
        <LoadingState label="Loading sale…" />
      ) : isError ? (
        <ErrorState title="Couldn't load sale" onRetry={() => refetch()} />
      ) : !data ? (
        <ErrorState
          title="Sale not found"
          description="It may not belong to your shop."
        />
      ) : (
        (() => {
          const { sale, items } = data;
          const voided = sale.status === "voided";
          return (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h1 className="font-mono text-lg font-semibold text-slate-900">
                  {billNumber(sale.id)}
                </h1>
                {voided && (
                  <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-danger">
                    Voided
                  </span>
                )}
              </div>

              {/* Meta */}
              <Card className="mb-4 divide-y divide-slate-100">
                <Row label="Date">
                  {format(parseISO(sale.created_at), "d MMM yyyy · h:mm a")}
                </Row>
                <Row label="Payment">
                  <span className="capitalize">{sale.payment_method}</span>
                </Row>
                {sale.note && <Row label="Customer / note">{sale.note}</Row>}
                {voided && sale.voided_at && (
                  <Row label="Voided at">
                    {format(parseISO(sale.voided_at), "d MMM yyyy · h:mm a")}
                    {sale.voided_reason ? ` · ${sale.voided_reason}` : ""}
                  </Row>
                )}
              </Card>

              {/* Items */}
              <Card className="mb-4">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-medium text-slate-700">
                    Items ({sale.item_count})
                  </p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {items.map((it) => (
                    <li key={it.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {it.medicine_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {it.quantity} × {formatMoney(it.unit_price_paise)}
                          </p>
                        </div>
                        <p className="shrink-0 font-medium text-slate-900">
                          {formatMoney(it.line_total_paise)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <span className="text-sm font-medium text-slate-700">
                    Grand total
                  </span>
                  <span
                    className={
                      voided
                        ? "text-lg font-bold text-slate-400 line-through"
                        : "text-lg font-bold text-slate-900"
                    }
                  >
                    {formatMoney(sale.total_paise)}
                  </span>
                </div>
              </Card>

              {/* Void action (append-only model: reverses + restores stock) */}
              {!voided && (
                <div className="border-t border-slate-100 pt-5">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setConfirmOpen(true)}
                    className="text-danger"
                  >
                    <Ban className="h-4 w-4" />
                    Void sale
                  </Button>
                  <p className="mt-2 text-center text-xs text-slate-400">
                    Voiding restores the sold stock. The record is kept for
                    history.
                  </p>
                </div>
              )}

              <ConfirmDialog
                open={confirmOpen}
                title={`Void ${billNumber(sale.id)}?`}
                description="This restores the sold quantities back to inventory and marks the sale as voided. It can't be undone."
                confirmLabel="Void sale"
                destructive
                loading={voidSale.isPending}
                onConfirm={handleVoid}
                onCancel={() => setConfirmOpen(false)}
              />
            </>
          );
        })()
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="min-w-0 truncate text-right text-sm text-slate-900">
        {children}
      </span>
    </div>
  );
}
