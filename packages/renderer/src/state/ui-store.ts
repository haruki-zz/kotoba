import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";

type UiState = {
  theme: ThemePreference;
  navOpen: boolean;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  setNavOpen: (isOpen: boolean) => void;
  toggleNav: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "system",
      navOpen: true,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setNavOpen: (isOpen) => set({ navOpen: isOpen }),
      toggleNav: () => set((state) => ({ navOpen: !state.navOpen })),
    }),
    {
      name: "kotoba-ui",
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
