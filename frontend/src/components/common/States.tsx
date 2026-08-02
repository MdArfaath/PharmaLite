import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Friendly, action-oriented empty state (PROJECT.md §21). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
      {Icon && (
        <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <p className="text-base font-medium text-slate-900">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Centered spinner for loading regions. */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Error region with an optional retry action. */
export function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-danger">
        <TriangleAlert className="h-6 w-6" />
      </span>
      <p className="text-base font-medium text-slate-900">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-600">{description}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" size="md" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
