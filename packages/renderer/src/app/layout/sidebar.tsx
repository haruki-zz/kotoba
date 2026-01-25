import { motion } from "framer-motion";
import { FlameKindling, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

import NavigationLink from "../../components/navigation/nav-link.js";
import Badge from "../../components/ui/badge.js";
import { cn } from "../../lib/utils.js";

export type NavItem = {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
};

type SidebarProps = {
  items: NavItem[];
  open: boolean;
  onClose: () => void;
};

const Sidebar = ({ items, open, onClose }: SidebarProps) => (
  <>
    <motion.aside
      initial={false}
      animate={{ x: open ? 0 : -12, opacity: open ? 1 : 1 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 overflow-hidden bg-surface/95 backdrop-blur-lg",
        "border border-border/60 shadow-soft md:relative md:h-[calc(100vh-2rem)]",
        "md:rounded-xl md:shadow-soft",
        open ? "translate-x-0" : "-translate-x-[105%]",
        "md:translate-x-0 md:w-64",
      )}
    >
      <div className="flex h-full flex-col gap-6 px-5 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-strong text-white shadow-glow">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-muted">Kotoba</p>
              <p className="text-base font-bold text-foreground">
                词汇练习导航
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {items.map((item) => (
            <NavigationLink
              key={item.path}
              to={item.path}
              label={item.label}
              icon={item.icon}
              onNavigate={onClose}
            />
          ))}
        </nav>

        <div className="rounded-lg border border-border bg-surface-soft p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-accent-soft text-accent-strong">
              <FlameKindling className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">今日专注</p>
              <p className="text-xs text-muted">
                今日学习与复习入口在左侧导航。
              </p>
            </div>
          </div>
          <Badge className="mt-3 w-fit" tone="muted">
            快捷键：Ctrl/Cmd + B 折叠菜单
          </Badge>
        </div>
      </div>
    </motion.aside>

    {open && (
      <div
        role="presentation"
        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />
    )}
  </>
);

export default Sidebar;
