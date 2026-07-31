import { Hammer } from "lucide-react";
import { EmptyState } from "@/components/common/States";

/**
 * Placeholder for screens implemented in later modules. Keeps the app shell
 * fully navigable now without faking functionality.
 */
export function ComingSoon({ module }: { module: string }) {
  return (
    <EmptyState
      icon={Hammer}
      title={`${module} is coming next`}
      description="This screen will be built in an upcoming module. The navigation and app shell are ready."
    />
  );
}
