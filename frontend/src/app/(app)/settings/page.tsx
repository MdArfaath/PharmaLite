import Link from "next/link";
import { ChevronRight, Store, User, Package, CalendarClock } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { getCurrentContext } from "@/features/auth/getCurrentContext";
import { ROUTES } from "@/lib/constants";

/**
 * Settings home. Shows the shop identity and current thresholds (read-only in
 * this module; editing lands with the Settings module). Account management and
 * sign-out are available now since they're part of the shell.
 */
export default async function SettingsPage() {
  const { shop, profile, email } = await getCurrentContext();

  // Layout already guarantees these exist, but guard for types.
  if (!shop || !profile) return null;

  return (
    <PageContainer>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Settings</h1>

      <div className="space-y-4">
        <Card className="divide-y divide-slate-100">
          <div className="flex items-center gap-3 p-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Store className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{shop.name}</p>
              <p className="text-sm text-slate-500">
                {shop.phone || "No phone added"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <User className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">
                {profile.full_name || "Owner"}
              </p>
              <p className="truncate text-sm text-slate-500">{email}</p>
            </div>
          </div>
        </Card>

        {/* Current thresholds (read-only for now). */}
        <Card className="p-4">
          <p className="mb-3 text-sm font-medium text-slate-700">
            Alert thresholds
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
              <Package className="h-4 w-4 text-warn" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {shop.settings.low_stock_threshold}
                </p>
                <p className="text-xs text-slate-500">Low stock at</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
              <CalendarClock className="h-4 w-4 text-danger" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {shop.settings.expiry_window_days} days
                </p>
                <p className="text-xs text-slate-500">Expiry window</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Editing thresholds arrives with the Settings module.
          </p>
        </Card>

        {/* Account row */}
        <Card>
          <Link
            href={ROUTES.account}
            className="flex items-center justify-between p-4 hover:bg-slate-50"
          >
            <span className="font-medium text-slate-900">Account</span>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </Link>
        </Card>

        <SignOutButton />

        <p className="pt-2 text-center text-xs text-slate-400">
          PharmaLite · v0.1
        </p>
      </div>
    </PageContainer>
  );
}
