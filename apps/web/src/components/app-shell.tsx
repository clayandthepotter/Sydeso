import Link from "next/link";
import type { ReactNode } from "react";

import { apiBaseUrl } from "../lib/api";
import { NavLink } from "./nav-link";

export interface NavItem {
  href: string;
  label: string;
  meta?: string;
  exact?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface Crumb {
  href?: string;
  label: string;
}

export function AppShell({
  groups,
  context,
  crumbs,
  actions,
  children,
}: {
  groups: NavGroup[];
  context?: { kind: string; name: string };
  crumbs: Crumb[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const apiHost = (() => {
    try {
      return new URL(apiBaseUrl()).host;
    } catch {
      return apiBaseUrl();
    }
  })();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <Link className="sidebar__mark" href="/app" aria-label="Sydeso, all organizations">
            <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
              <path d="M4 4h14l10 10v14H14L4 18Z" fill="currentColor" />
              <path d="M11 11h10v10H11Z" fill="var(--accent)" />
            </svg>
          </Link>
          <span className="sidebar__name">Sydeso</span>
        </div>
        <nav className="sidebar__scroll" aria-label="Application">
          {context && (
            <div className="sidebar__context">
              <span className="mono muted">{context.kind}</span>
              <strong>{context.name}</strong>
            </div>
          )}
          {groups.map(group => (
            <div className="sidebar__group" key={group.label}>
              <p className="sidebar__label mono">{group.label}</p>
              {group.items.map(item => (
                <NavLink key={item.href} href={item.href} exact={item.exact}>
                  <span>{item.label}</span>
                  {item.meta && <span className="mono">{item.meta}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar__foot mono">API · {apiHost}</div>
      </aside>
      <div className="main">
        <header className="topbar">
          <nav className="crumbs mono" aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;
              return (
                <span key={`${crumb.label}-${index}`} aria-current={last ? "page" : undefined}>
                  {index > 0 && <span aria-hidden="true"> / </span>}
                  {crumb.href && !last ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
                </span>
              );
            })}
          </nav>
          {actions && <div className="form__row">{actions}</div>}
        </header>
        <div className="page">{children}</div>
      </div>
    </div>
  );
}
