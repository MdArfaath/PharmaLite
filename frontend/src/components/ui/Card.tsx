import { cn } from "@/lib/utils/cn";

/** Surface container with subtle border + shadow. */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
