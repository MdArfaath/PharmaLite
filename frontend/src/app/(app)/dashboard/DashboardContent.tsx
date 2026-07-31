"use client";

import Link from "next/link";
import {
  Package,
  TriangleAlert,
  CalendarClock,
  IndianRupee,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/common/States";
import { useDashboardStats } from "@/features/dashboard/queries";
import { formatMoney } from "@/lib/utils/money";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

function StatCard({
  href,
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  href: string;
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "warn" | "danger" | "brand";
}) {
  const toneClasses = {
    neutral: "text-slate-600 bg-slate-100",
    warn: "text-warn bg-amber-50",
    danger: "text-danger bg-red-50",
    brand: "text-brand-700 bg-brand-100",
  }[tone];

  return (
    <Link href={href}>
      <Card className="p-4 transition-colors hover:border-slate-300">
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg",
            toneClasses,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </Card>
    </Link>
  );
}

export function DashboardContent() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading || !data) return <LoadingState />;

  return (
    <div className="space-y-5">
      {/* Today's sales — the headline number. */}
      <Card className="bg-brand-600 p-5 text-white">
        <div className="flex items-center gap-2 text-brand-100">
          <IndianRupee className="h-4 w-4" />
          <span className="text-sm">Today&apos;s sales</span>
        </div>
        <p className="mt-1 text-3xl font-bold">
          {formatMoney(data.today_sales_paise)}
        </p>
        <p className="text-sm text-brand-100">
          {data.today_sales_count}{" "}
          {data.today_sales_count === 1 ? "sale" : "sales"} today
        </p>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={ROUTES.sell}>
          <button className="flex min-h-touch w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700">
            <ShoppingCart className="h-5 w-5" />
            Sell
          </button>
        </Link>
        <Link href={ROUTES.inventoryNew}>
          <button className="flex min-h-touch w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-800 hover:bg-slate-50">
            <Plus className="h-5 w-5" />
            Add stock
          </button>
        </Link>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          href={ROUTES.inventory}
          label="Medicines"
          value={String(data.medicine_count)}
          icon={Package}
          tone="brand"
        />
        <StatCard
          href={ROUTES.lowStock}
          label="Low stock"
          value={String(data.low_stock_count)}
          icon={TriangleAlert}
          tone="warn"
        />
        <StatCard
          href={ROUTES.expiry}
          label="Expiring soon"
          value={String(data.expiring_count)}
          icon={CalendarClock}
          tone="danger"
        />
        <StatCard
          href={ROUTES.sales}
          label="Sales today"
          value={String(data.today_sales_count)}
          icon={IndianRupee}
          tone="neutral"
        />
      </div>
    </div>
  );
}
