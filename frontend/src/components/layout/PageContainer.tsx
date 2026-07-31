import { cn } from "@/lib/utils/cn";

/**
 * Consistent page padding + max width. Mobile-first: content column caps at a
 * comfortable phone-ish width and centers on larger screens. Bottom padding
 * leaves room for the fixed BottomNav.
 */
export function PageContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md px-4 pb-28 pt-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
