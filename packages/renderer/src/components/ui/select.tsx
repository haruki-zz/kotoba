import type { SelectHTMLAttributes } from "react";

import { cn } from "../../lib/utils.js";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const Select = ({ className, children, ...props }: SelectProps) => (
  <select
    className={cn(
      "h-10 w-full rounded-md border border-border bg-surface-soft px-3 text-sm text-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
      "disabled:cursor-not-allowed disabled:opacity-60",
      className,
    )}
    {...props}
  >
    {children}
  </select>
);

export default Select;
