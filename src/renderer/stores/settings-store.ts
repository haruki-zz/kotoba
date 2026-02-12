import { create } from 'zustand';

import {
  APP_SETTINGS_VERSION,
  AppSettings,
  SettingsMeta,
  SettingsSnapshot,
  defaultAppSettings,
} from '@shared/types';

const SETTINGS_CACHE_KEY = `kotoba.settings.snapshot.v${APP_SETTINGS_VERSION}`;

type SettingsStoreState = {
  settings: AppSettings;
  meta: SettingsMeta | null;
  applySnapshot: (snapshot: SettingsSnapshot) => void;
  hydrateFromCache: () => void;
  clearCache: () => void;
};

const readCache = (): SettingsSnapshot | null => {
  if (typeof window === 'undefined') return null;
  if (!window.localStorage || typeof window.localStorage.getItem !== 'function') return null;

  const raw = window.localStorage.getItem(SETTINGS_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SettingsSnapshot;
    if (!parsed?.settings || !parsed?.meta) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (snapshot: SettingsSnapshot) => {
  if (typeof window === 'undefined') return;
  if (!window.localStorage || typeof window.localStorage.setItem !== 'function') return;
  window.localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(snapshot));
};

const clearCacheStorage = () => {
  if (typeof window === 'undefined') return;
  if (!window.localStorage || typeof window.localStorage.removeItem !== 'function') return;
  window.localStorage.removeItem(SETTINGS_CACHE_KEY);
};

export const resolveThemeMode = (mode: AppSettings['appearance']['themeMode']) => {
  if (mode !== 'system') return mode;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyThemeMode = (mode: AppSettings['appearance']['themeMode']) => {
  if (typeof document === 'undefined') return;
  const resolved = resolveThemeMode(mode);
  document.documentElement.setAttribute('data-theme', resolved);
};

const initialSnapshot = readCache();

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  settings: initialSnapshot?.settings ?? defaultAppSettings,
  meta: initialSnapshot?.meta ?? null,
  applySnapshot: (snapshot) => {
    writeCache(snapshot);
    applyThemeMode(snapshot.settings.appearance.themeMode);
    set({
      settings: snapshot.settings,
      meta: snapshot.meta,
    });
  },
  hydrateFromCache: () => {
    const cached = readCache();
    if (!cached) return;
    applyThemeMode(cached.settings.appearance.themeMode);
    set({
      settings: cached.settings,
      meta: cached.meta,
    });
  },
  clearCache: () => {
    clearCacheStorage();
    set({
      settings: defaultAppSettings,
      meta: null,
    });
  },
}));
