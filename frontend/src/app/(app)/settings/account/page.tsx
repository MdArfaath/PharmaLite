import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { getCurrentContext } from "@/features/auth/getCurrentContext";
import { ROUTES } from "@/lib/constants";

/**
 * Account details. Email/password management (change password) lands with the
 * Settings module; for now it shows the account email and offers sign-out.
 */
export default async function AccountPage() {
  const { email, profile } = await getCurrentContext();

  return (
    <PageContainer>
      <Link
        href={ROUTES.settings}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Settings
      </Link>

      <h1 className="mb-4 text-lg font-semibold text-slate-900">Account</h1>

      <Card className="divide-y divide-slate-100">
        <div className="p-4">
          <p className="text-xs text-slate-500">Name</p>
          <p className="font-medium text-slate-900">
            {profile?.full_name || "Owner"}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500">Email</p>
          <p className="font-medium text-slate-900">{email}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500">Role</p>
          <p className="font-medium capitalize text-slate-900">
            {profile?.role || "owner"}
          </p>
        </div>
      </Card>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </PageContainer>
  );
}
