import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "../app/auth-actions";
import { api, apiBaseUrl } from "../lib/api";
import { listAllProjects } from "../lib/catalog";
import { CommandBar, CommandButton, type Command } from "./command-bar";
import { Icon, type IconName } from "./icons";
import { Mark } from "./mark";
import { NavLink } from "./nav-link";

export interface NavItem {
  href: string;
  label: string;
  icon?: IconName;
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

export interface PrimaryAction {
  href: string;
  label: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]!.toUpperCase())
    .join("");
}

/**
 * The frame around every product page: a sidebar with the project switcher, the primary action,
 * the command bar and grouped navigation; a topbar with the breadcrumb and page actions.
 */
export async function AppShell({
  groups,
  projectId,
  switchLabel,
  context,
  crumbs,
  primary,
  actions,
  children,
}: {
  groups: NavGroup[];
  /** The project the page belongs to; selects it in the switcher. */
  projectId?: string;
  /** What the switcher shows when no project is selected. */
  switchLabel?: string;
  context?: { kind: string; name: string };
  crumbs: Crumb[];
  primary?: PrimaryAction;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [me, projects] = await Promise.all([api.me(), listAllProjects()]);
  const current = projects.find(entry => entry.project.id === projectId);
  const organizations = Array.from(new Map(projects.map(entry => [entry.organization.id, entry.organization])).values());
  const apiHost = (() => {
    try {
      return new URL(apiBaseUrl()).host;
    } catch {
      return apiBaseUrl();
    }
  })();
  const commands: Command[] = [
    ...groups.flatMap(group => group.items.map(item => ({ href: item.href, label: item.label, group: group.label, icon: item.icon }))),
    ...projects
      .filter(entry => entry.project.id !== projectId)
      .map(entry => ({ href: `/app/projects/${entry.project.id}/requests`, label: entry.project.name, group: "Projects", icon: "project" as const })),
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <details className="switch">
          <summary className="switch__btn" aria-label="Switch project">
            <span className="switch__mark">
              <Mark size={14} />
            </span>
            <span>{current?.project.name ?? switchLabel ?? "All projects"}</span>
            <Icon name="chevron-down" size={14} />
          </summary>
          <div className="switch__menu" role="menu">
            <Link className="menu__item" role="menuitem" href="/app" aria-current={!projectId && !switchLabel ? "true" : undefined}>
              <Icon name="menu" />
              <span>All projects</span>
              {!projectId && !switchLabel && <Icon name="check" size={14} />}
            </Link>
            {organizations.map(organization => (
              <div key={organization.id}>
                <p className="menu__label mono">{organization.name}</p>
                {projects
                  .filter(entry => entry.organization.id === organization.id)
                  .map(entry => (
                    <Link
                      key={entry.project.id}
                      className="menu__item"
                      role="menuitem"
                      href={`/app/projects/${entry.project.id}/requests`}
                      aria-current={entry.project.id === projectId ? "true" : undefined}
                    >
                      <Icon name="project" />
                      <span>{entry.project.name}</span>
                      {entry.project.id === projectId && <Icon name="check" size={14} />}
                    </Link>
                  ))}
              </div>
            ))}
            <div className="menu__sep" />
            <Link className="menu__item" role="menuitem" href="/app/organizations">
              <Icon name="organization" />
              <span>Organizations</span>
            </Link>
          </div>
        </details>

        <div className={primary ? "sidebar__tools" : "sidebar__tools sidebar__tools--search"}>
          {primary && (
            <Link className="btn btn--accent" href={primary.href}>
              <Icon name="plus" size={14} />
              {primary.label}
            </Link>
          )}
          <CommandButton wide={!primary} />
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
                <NavLink key={item.href} href={item.href} icon={item.icon} exact={item.exact}>
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
              <span className="avatar" aria-hidden="true">
                {initials(me.user.name)}
              </span>
              <div>
                <strong>{me.user.name}</strong>
                <span className="mono-text muted">{me.user.email}</span>
              </div>
              <form action={signOutAction}>
                <button className="sidebar__signout" type="submit" aria-label="Sign out" title="Sign out">
                  <Icon name="sign-out" />
                </button>
              </form>
            </div>
          )}
          <span className="sidebar__api">API · {apiHost}</span>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <nav className="crumbs" aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;
              return (
                <span key={`${crumb.label}-${index}`} aria-current={last ? "page" : undefined}>
                  {index > 0 && (
                    <span className="crumbs__sep" aria-hidden="true">
                      <Icon name="chevron-right" size={12} />
                    </span>
                  )}
                  {crumb.href && !last ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
                </span>
              );
            })}
          </nav>
          {actions && <div className="topbar__actions">{actions}</div>}
        </header>
        <div className="page">{children}</div>
      </div>

      <CommandBar commands={commands} />
    </div>
  );
}

/** The navigation shared by every page outside a project. */
export const sydesoGroup: NavGroup = {
  label: "Sydeso",
  items: [
    { href: "/app", label: "Home", icon: "menu", exact: true },
    { href: "/app/organizations", label: "Organizations", icon: "organization", exact: true },
    { href: "/app/design-lock", label: "Design lock", icon: "design" },
  ],
};
