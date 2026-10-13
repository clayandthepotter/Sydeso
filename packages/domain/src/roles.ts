// Roles and permissions for the MVP, from docs/product/roles-and-permissions.md.
// Permissions are granted per organization and inherit downward to workspaces and projects.

export const organizationRoles = ["owner", "admin", "product_manager", "engineer", "reviewer", "viewer"] as const;

export type OrganizationRole = (typeof organizationRoles)[number];

export const permissionGroups = {
  organization: ["read", "update", "delete", "billing.read", "billing.manage", "members.read", "members.manage"],
  workspace: ["read", "create", "update", "delete", "members.manage"],
  project: ["read", "create", "update", "archive", "delete"],
  story: ["read", "create", "update", "delete", "prioritize"],
  workflow: ["read", "execute", "transition", "cancel", "escalate"],
  approval: ["read", "request", "approve", "reject"],
  artifact: ["read", "create", "update", "delete", "approve", "reject", "version.read"],
  agent: ["read", "execute", "cancel", "configure", "logs.read", "skills.manage"],
  runner: ["read", "register", "update", "delete", "assign", "logs.read"],
  memory: ["read", "write", "delete", "search"],
  release: ["read", "create", "approve", "publish", "rollback"],
  audit: ["read"],
  settings: ["read", "update"],
  integrations: ["manage"],
  roles: ["manage"],
} as const;

type PermissionGroup = keyof typeof permissionGroups;

type PermissionOf<G extends PermissionGroup> = `${G}.${(typeof permissionGroups)[G][number]}`;

export type Permission = { [G in PermissionGroup]: PermissionOf<G> }[PermissionGroup];

export const permissions: Permission[] = (Object.keys(permissionGroups) as PermissionGroup[]).flatMap(group =>
  permissionGroups[group].map(action => `${group}.${action}` as Permission),
);

const group = (name: PermissionGroup): Permission[] =>
  permissionGroups[name].map(action => `${name}.${action}` as Permission);

/** Every role can see the organization and its workspaces; that is how the app navigates. */
const navigation: Permission[] = ["organization.read", "workspace.read"];

/**
 * The role permission matrix. Owner holds every permission. Admin holds everything except
 * the two actions the security constraints reserve for the owner: deleting the organization
 * and managing billing.
 */
export const rolePermissions: Record<OrganizationRole, ReadonlySet<Permission>> = {
  owner: new Set(permissions),
  admin: new Set(permissions.filter(p => p !== "organization.delete" && p !== "organization.billing.manage")),
  product_manager: new Set<Permission>([
    ...navigation,
    "organization.members.read",
    ...group("project"),
    ...group("story"),
    ...group("workflow"),
    ...group("approval"),
    ...group("artifact"),
    "agent.read",
    "agent.execute",
    "agent.logs.read",
    "runner.read",
    "memory.read",
    "memory.search",
    "release.read",
    "release.approve",
  ]),
  engineer: new Set<Permission>([
    ...navigation,
    "organization.members.read",
    ...group("project"),
    ...group("story"),
    "workflow.read",
    "workflow.execute",
    "workflow.transition",
    "approval.read",
    "approval.approve",
    "approval.reject",
    ...group("artifact"),
    "agent.read",
    "agent.execute",
    "agent.logs.read",
    "runner.read",
    "memory.read",
    "memory.search",
    "release.read",
  ]),
  reviewer: new Set<Permission>([
    ...navigation,
    "organization.members.read",
    "project.read",
    "story.read",
    "workflow.read",
    "approval.read",
    "approval.approve",
    "approval.reject",
    "artifact.read",
    "artifact.version.read",
    "agent.read",
    "release.read",
  ]),
  viewer: new Set<Permission>([
    ...navigation,
    "organization.members.read",
    "project.read",
    "story.read",
    "workflow.read",
    "approval.read",
    "artifact.read",
    "artifact.version.read",
    "agent.read",
    "release.read",
  ]),
};

export function hasPermission(role: OrganizationRole, permission: Permission) {
  return rolePermissions[role].has(permission);
}

export function permissionsForRole(role: OrganizationRole): Permission[] {
  return [...rolePermissions[role]];
}

/** Roles a member with the given role may grant to others. Owners may make other owners; admins may not. */
export function assignableRoles(role: OrganizationRole): OrganizationRole[] {
  if (role === "owner") return [...organizationRoles];
  if (role === "admin") return organizationRoles.filter(r => r !== "owner");
  return [];
}
