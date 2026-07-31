import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/common/States";
import { LoginForm } from "./LoginForm";

/**
 * Login route. LoginForm uses useSearchParams() (to honor ?redirectedFrom),
 * so it's wrapped in Suspense per Next.js App Router requirements.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <LoadingState />
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
