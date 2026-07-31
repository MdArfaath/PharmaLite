"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/features/auth/authActions";
import { ROUTES } from "@/lib/constants";

/** Signs the user out and returns to the login screen. */
export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await signOut();
    router.replace(ROUTES.login);
    router.refresh();
  }

  return (
    <Button
      variant="secondary"
      fullWidth
      loading={loading}
      onClick={handleSignOut}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
