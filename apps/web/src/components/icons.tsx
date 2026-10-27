import type { SVGProps } from "react";

/**
 * The product's icon set: 16px line icons on a 16 grid, 1.5px stroke, currentColor.
 * Kept small on purpose; add one here before using it anywhere.
 */
export type IconName =
  | "organization"
  | "workspace"
  | "project"
  | "feature"
  | "artifact"
  | "runner"
  | "audit"
  | "members"
  | "design"
  | "search"
  | "plus"
  | "chevron-down"
  | "chevron-right"
  | "check"
  | "circle"
  | "circle-dot"
  | "circle-half"
  | "circle-check"
  | "alert"
  | "download"
  | "external"
  | "key"
  | "sign-out"
  | "menu"
  | "x";

const paths: Record<IconName, string> = {
  organization: "M2.5 13.5h11M3.5 13.5v-9l4.5-2.5 4.5 2.5v9M6.5 13.5v-3h3v3M6 7.5h.01M10 7.5h.01",
  workspace: "M2.5 4.5h11v8h-11zM2.5 7h11M5.5 4.5v-1.5h5v1.5",
  project: "M2.5 2.5h4.5v4.5h-4.5zM9 2.5h4.5v4.5h-4.5zM2.5 9h4.5v4.5h-4.5zM9 9h4.5v4.5h-4.5z",
  feature: "M3 4.5h10M3 8h10M3 11.5h6",
  artifact: "M8 2l5.5 3v6l-5.5 3-5.5-3v-6zM8 8l5.5-3M8 8v6M8 8l-5.5-3",
  runner: "M4.5 4.5h7v7h-7zM6.5 6.5h3v3h-3zM8 2v2.5M8 11.5v2.5M2 8h2.5M11.5 8h2.5",
  audit: "M8 4.5v3.5l2.5 1.5M8 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12z",
  members: "M6 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2 13.5c.5-2.5 2-3.5 4-3.5s3.5 1 4 3.5M10.5 7.5a2 2 0 1 0 0-4M12 10c1.2.4 1.8 1.5 2 3.5",
  design: "M8 14a6 6 0 1 1 0-12c3 0 6 2 6 4.5 0 1.5-1 2-2 2h-1.5a1.5 1.5 0 0 0-1 2.5c.5.8 0 3-1.5 3zM5.5 6h.01M8 4h.01M10.5 6h.01",
  search: "M7 11.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM10.5 10.5l3.5 3.5",
  plus: "M8 3v10M3 8h10",
  "chevron-down": "M4 6l4 4 4-4",
  "chevron-right": "M6 4l4 4-4 4",
  check: "M3.5 8.5l3 3 6-7",
  circle: "M8 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12z",
  "circle-dot": "M8 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  "circle-half": "M8 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8 2v12a6 6 0 0 0 0-12z",
  "circle-check": "M8 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM5.5 8l2 2 3.5-4",
  alert: "M8 2.5l6 11h-12zM8 6.5v3M8 11.5h.01",
  download: "M8 2.5v8M4.5 7l3.5 3.5 3.5-3.5M3 13.5h10",
  external: "M6.5 3.5h-3v9h9v-3M9 3.5h3.5v3.5M12.5 3.5l-6 6",
  key: "M10.5 9a3.5 3.5 0 1 0-3.3-2.3L2.5 11.5v2h2v-1.5h1.5v-1.5h1.5l1.2-1.2A3.5 3.5 0 0 0 10.5 9z",
  "sign-out": "M6.5 2.5h-4v11h4M10 11l3-3-3-3M13 8h-7",
  menu: "M2.5 4.5h11M2.5 8h11M2.5 11.5h11",
  x: "M4 4l8 8M12 4l-8 8",
};

export function Icon({ name, size = 16, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {name === "circle-half" ? (
        <>
          <path d="M8 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
          <path d="M8 2v12a6 6 0 0 0 0-12z" fill="currentColor" stroke="none" />
        </>
      ) : (
        <path d={paths[name]} />
      )}
    </svg>
  );
}
