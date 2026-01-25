import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils.js";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "neutral" | "accent";
};

const toneClassName: Record<NonNullable<CardProps["tone"]>, string> = {
  neutral:
    "bg-surface/70 backdrop-blur border border-border shadow-soft shadow-black/5",
  accent:
    "bg-gradient-to-br from-accent/12 via-surface-soft to-accent-soft border border-accent/30 shadow-glow",
};

const Card = ({ className, tone = "neutral", ...props }: CardProps) => (
  <div
    className={cn("rounded-lg p-5", toneClassName[tone], className)}
    {...props}
  />
);

export default Card;
