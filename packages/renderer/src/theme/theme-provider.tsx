import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { isBrowser } from "../lib/utils.js";
import { type ThemePreference, useUiStore } from "../state/ui-store.js";

type ThemeValue = {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

const getSystemTheme = (): "light" | "dark" =>
  isBrowser && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

const resolveTheme = (pref: ThemePreference): "light" | "dark" =>
  pref === "system" ? getSystemTheme() : pref;

const applyThemeToDocument = (theme: "light" | "dark") => {
  if (!isBrowser) return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
};

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    resolveTheme(theme),
  );

  useEffect(() => {
    const next = resolveTheme(theme);
    setResolvedTheme(next);
    applyThemeToDocument(next);

    if (!isBrowser || theme !== "system") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = resolveTheme("system");
      setResolvedTheme(resolved);
      applyThemeToDocument(resolved);
    };

    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
};

export default ThemeProvider;
