import Link from "next/link";
import { ChevronRight, User } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { getCurrentContext } from "@/features/auth/getCurrentContext";
import { ROUTES } from "@/lib/constants";
import { SettingsForm } from "./SettingsForm";

/**
 * Settings home. Editable shop preferences (name, phone, alert thresholds,
 * currency) via SettingsForm, plus the account link and sign-out. The shop is
 * loaded server-side; the form owns editing + persistence.
 */
export default async function SettingsPage() {
  const { shop, profile, email } = await getCurrentContext();

  // The (app) layout already guarantees these exist; guard for types.
  if (!shop || !profile) return null;

  return (
    <PageContainer>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Settings</h1>

      <div className="space-y-4">
        <SettingsForm initial={shop} />

        {/* Account row */}
        <Card>
          <Link
            href={ROUTES.account}
            className="flex items-center gap-3 p-4 hover:bg-slate-50"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <User className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">
                {profile.full_name || "Owner"}
              </p>
              <p className="truncate text-sm text-slate-500">{email}</p>
            </div>
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
