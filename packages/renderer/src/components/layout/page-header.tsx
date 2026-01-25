import type { ReactNode } from "react";

import { cn } from "../../lib/utils.js";
import Badge from "../ui/badge.js";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  accent?: string;
  actions?: ReactNode;
  className?: string;
};

const PageHeader = ({
  eyebrow,
  title,
  description,
  accent,
  actions,
  className,
}: PageHeaderProps) => (
  <div
    className={cn(
      "flex flex-col gap-3 rounded-xl border border-border bg-surface-soft/70 p-5 shadow-soft",
      "sm:flex-row sm:items-center sm:justify-between",
      className,
    )}
  >
    <div className="max-w-2xl space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {eyebrow}
          </span>
        ) : null}
        {accent ? <Badge tone="accent">{accent}</Badge> : null}
      </div>
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
    </div>
    {actions ? (
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    ) : null}
  </div>
);

export default PageHeader;
