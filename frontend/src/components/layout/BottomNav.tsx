"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Bell,
  ClipboardList,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

/**
 * Bottom tab bar (PROJECT.md §12). Five targets with SELL as the prominent
 * raised center action — the most frequent, most time-critical operation.
 * Fixed to the viewport bottom with safe-area padding for gesture phones.
 */

interface Tab {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPrefix: string;
}

const leftTabs: Tab[] = [
  {
    href: ROUTES.dashboard,
    label: "Home",
    icon: LayoutDashboard,
    matchPrefix: "/dashboard",
  },
  {
    href: ROUTES.inventory,
    label: "Inventory",
    icon: Package,
    matchPrefix: "/inventory",
  },
];

const rightTabs: Tab[] = [
  {
    href: ROUTES.lowStock,
    label: "Alerts",
    icon: Bell,
    matchPrefix: "/alerts",
  },
  {
    href: ROUTES.sales,
    label: "Sales",
    icon: ClipboardList,
    matchPrefix: "/sales",
  },
];

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium",
        active ? "text-brand-600" : "text-slate-500 hover:text-slate-700",
      )}
    >
      <Icon className="h-5 w-5" />
      {tab.label}
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);
  const sellActive = isActive("/sell");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-safe-b"
      aria-label="Primary"
    >
      <div className="mx-auto flex w-full max-w-md items-stretch px-2">
        {leftTabs.map((tab) => (
          <TabLink key={tab.href} tab={tab} active={isActive(tab.matchPrefix)} />
        ))}

        {/* Center SELL action — raised and prominent. */}
        <div className="flex flex-1 items-center justify-center">
          <Link
            href={ROUTES.sell}
            aria-label="Sell medicine"
            className={cn(
              "-mt-6 inline-flex h-16 w-16 flex-col items-center justify-center rounded-full shadow-lg transition-transform active:scale-95",
              sellActive
                ? "bg-brand-700 text-white"
                : "bg-brand-600 text-white hover:bg-brand-700",
            )}
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="text-[10px] font-semibold">Sell</span>
          </Link>
        </div>

        {rightTabs.map((tab) => (
          <TabLink key={tab.href} tab={tab} active={isActive(tab.matchPrefix)} />
        ))}
      </div>
    </nav>
  );
}
