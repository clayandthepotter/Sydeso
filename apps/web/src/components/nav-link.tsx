"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Icon, type IconName } from "./icons";

export function NavLink({
  href,
  icon,
  children,
  exact = false,
}: {
  href: string;
  icon?: IconName;
  children: ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const current = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link className="sidebar__link" href={href} aria-current={current ? "page" : undefined}>
      {icon && <Icon name={icon} />}
      {children}
    </Link>
  );
}
