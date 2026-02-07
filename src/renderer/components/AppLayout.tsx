import React, { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

type NavItem = {
  to: string;
  label: string;
  badge?: string;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/today', label: 'Today' },
  { to: '/review', label: 'Review', badge: 'SM-2' },
];

export function AppLayout({ children }: PropsWithChildren) {
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
          <span className="nav-hint">Space: 展开 · 1/2/3: Hard/Med/Easy · ⌘Z: 回退</span>
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
