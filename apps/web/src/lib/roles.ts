import { hasPermission, organizationRoles, type OrganizationRole, type Permission } from "@sydeso/domain";

const labels: Record<OrganizationRole, string> = {
  owner: "Owner",
  admin: "Admin",
  product_manager: "Product manager",
  engineer: "Engineer",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

export function roleLabel(role: OrganizationRole) {
  return labels[role];
}

export const roleOptions = organizationRoles.map(role => ({ value: role, label: labels[role] }));

/** UI gating mirrors the API's checks so buttons only appear when the request would succeed. */
export function can(role: OrganizationRole | undefined, permission: Permission) {
  return role ? hasPermission(role, permission) : false;
}
