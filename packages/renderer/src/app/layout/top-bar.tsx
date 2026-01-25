import { ArrowUpRight, Menu, ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";

import ThemeToggle from "../../components/theme/theme-toggle.js";
import Badge from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";

type TopBarProps = {
  onToggleNav: () => void;
};

const routeTitleMap: Record<string, string> = {
  "/": "主页",
  "/today": "今日学习",
  "/review": "复习",
  "/library": "词库",
  "/settings": "设置",
};

const TopBar = ({ onToggleNav }: TopBarProps) => {
  const { pathname } = useLocation();
  const title = routeTitleMap[pathname] ?? "导航";

  return (
    <header className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-surface/80 px-4 py-3 shadow-soft backdrop-blur">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={onToggleNav}
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            渲染端基线
          </p>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold leading-tight text-foreground">
              {title}
            </h1>
            <Badge tone="muted">alpha</Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-surface-soft px-3 py-2 text-xs font-semibold text-muted md:flex">
          <ShieldCheck className="h-4 w-4 text-accent-strong" />
          <span>统一主题与动效已启用</span>
        </div>
        <ThemeToggle />
        <Button variant="subtle" size="sm" className="hidden md:inline-flex">
          查看设计准则
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default TopBar;
