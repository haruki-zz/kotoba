import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";

import { cn } from "../../lib/utils.js";

type NavLinkProps = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onNavigate?: () => void;
};

const NavigationLink = ({
  to,
  label,
  icon: Icon,
  onNavigate,
}: NavLinkProps) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    className={({ isActive }) =>
      cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
        "hover:bg-accent-soft hover:text-accent-strong",
        isActive ? "bg-accent-soft text-accent-strong" : "text-foreground/80",
      )
    }
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </NavLink>
);

export default NavigationLink;
