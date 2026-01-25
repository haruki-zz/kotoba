import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils.js";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "accent" | "success" | "warning" | "muted";
};

const toneClassName: Record<NonNullable<BadgeProps["tone"]>, string> = {
  accent: "bg-accent-soft text-accent-strong",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  muted: "bg-surface-soft text-muted",
};

const Badge = ({ className, tone = "accent", ...props }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
      "border border-transparent",
      toneClassName[tone],
      className,
    )}
    {...props}
  />
);

export default Badge;
