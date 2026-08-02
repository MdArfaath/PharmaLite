"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/** Native select styled to match Input, with a large touch target. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "block w-full appearance-none rounded-xl border bg-white px-4 min-h-touch text-base text-slate-900",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
          invalid ? "border-danger" : "border-slate-200",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";
