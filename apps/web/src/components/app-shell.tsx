import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "../app/auth-actions";
import { api, apiBaseUrl } from "../lib/api";
import { Mark } from "./mark";
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

export async function AppShell({
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
  const me = await api.me();
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
            <Mark size={26} />
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
        <div className="sidebar__foot">
          {me && (
            <div className="sidebar__user">
              <strong>{me.user.name}</strong>
              <span className="mono-text muted">{me.user.email}</span>
              <form action={signOutAction}>
                <button className="sidebar__signout mono" type="submit">
                  Sign out
                </button>
              </form>
            </div>
          )}
          <span className="mono">API · {apiHost}</span>
        </div>
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
