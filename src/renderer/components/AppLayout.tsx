import { useQuery } from '@tanstack/react-query';
import React, { PropsWithChildren, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router-dom';

import { fetchSettingsSnapshot } from '../api/settings';
import { formatShortcutLabel } from '../features/settings/shortcut-utils';
import { applyThemeMode, useSettingsStore } from '../stores/settings-store';

type NavItem = {
  to: string;
  label: string;
  badge?: string;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/today', label: 'Today' },
  { to: '/review', label: 'Review', badge: 'SM-2' },
  { to: '/library', label: 'Library' },
  { to: '/settings', label: 'Settings' },
];

export function AppLayout({ children }: PropsWithChildren) {
  const { settings, applySnapshot, hydrateFromCache } = useSettingsStore();

  useQuery({
    queryKey: ['settings', 'snapshot'],
    queryFn: fetchSettingsSnapshot,
    refetchOnWindowFocus: false,
    onSuccess: (snapshot) => applySnapshot(snapshot),
  });

  useEffect(() => {
    hydrateFromCache();
  }, [hydrateFromCache]);

  useEffect(() => {
    applyThemeMode(settings.appearance.themeMode);
  }, [settings.appearance.themeMode]);

  const shortcutHint = useMemo(() => {
    return `${formatShortcutLabel(settings.shortcuts.toggleDetails)}: 展开 · ${formatShortcutLabel(
      settings.shortcuts.scoreHard
    )}/${formatShortcutLabel(settings.shortcuts.scoreMedium)}/${formatShortcutLabel(
      settings.shortcuts.scoreEasy
    )}: Hard/Med/Easy · ${formatShortcutLabel(settings.shortcuts.undoReview)}: 回退`;
  }, [
    settings.shortcuts.scoreEasy,
    settings.shortcuts.scoreHard,
    settings.shortcuts.scoreMedium,
    settings.shortcuts.toggleDetails,
    settings.shortcuts.undoReview,
  ]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span className="brand-name">Kotoba</span>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end={item.to === '/'}
            >
              {item.label}
              {item.badge ? <span className="pill">{item.badge}</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <span className="nav-hint">{shortcutHint}</span>
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
