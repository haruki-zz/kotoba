import { Home, Layers3, LibraryBig, Settings, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import SkipLink from "../../components/a11y/skip-link.js";
import { FadeIn } from "../../components/motion/presets.js";
import Card from "../../components/ui/card.js";
import { useUiStore } from "../../state/ui-store.js";
import { useTheme } from "../../theme/theme-provider.js";
import Sidebar, { type NavItem } from "./sidebar.js";
import TopBar from "./top-bar.js";

const navItems: NavItem[] = [
  { path: "/", label: "主页", icon: Home },
  { path: "/today", label: "今日学习", icon: Sparkles },
  { path: "/review", label: "复习", icon: Layers3 },
  { path: "/library", label: "词库", icon: LibraryBig },
  { path: "/settings", label: "设置", icon: Settings },
];

const AppShell = () => {
  const { navOpen, toggleNav, setNavOpen } = useUiStore();
  const { toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname, setNavOpen]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const hasMeta = event.metaKey || event.ctrlKey;
      if (hasMeta && key === "b") {
        event.preventDefault();
        toggleNav();
      }
      if (hasMeta && key === "j") {
        event.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleNav, toggleTheme]);

  return (
    <div className="relative min-h-screen">
      <SkipLink />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.12),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.14),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05),transparent_40%)]" />
      </div>

      <div className="relative mx-auto flex max-w-7xl gap-5 px-4 py-5 md:px-6 md:py-6 lg:px-8">
        <Sidebar
          items={navItems}
          open={navOpen}
          onClose={() => setNavOpen(false)}
        />
        <div className="flex w-full flex-col gap-4 md:pl-2">
          <TopBar onToggleNav={toggleNav} />
          <main
            id="main-content"
            className="rounded-2xl border border-border/70 bg-surface/90 px-4 py-4 shadow-soft backdrop-blur"
          >
            <FadeIn>
              <Card className="mb-4 grid grid-cols-1 gap-4 border-none bg-transparent p-0 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-surface-soft p-4">
                  <p className="text-sm font-semibold text-muted">设计体系</p>
                  <p className="text-lg font-bold text-foreground">
                    主题 / 令牌 / 动效
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-soft p-4">
                  <p className="text-sm font-semibold text-muted">导航</p>
                  <p className="text-lg font-bold text-foreground">
                    首页・今日学习・复习・词库・设置
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-soft p-4">
                  <p className="text-sm font-semibold text-muted">快捷键</p>
                  <p className="text-lg font-bold text-foreground">
                    Cmd/Ctrl + B：导航 ・ Cmd/Ctrl + J：主题
                  </p>
                </div>
              </Card>
              <Outlet />
            </FadeIn>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
