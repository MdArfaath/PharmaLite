import { Pill } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Wordmark + icon. The single brand accent lives here. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
        <Pill className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">
        Pharma<span className="text-brand-600">Lite</span>
      </span>
    </span>
  );
}
