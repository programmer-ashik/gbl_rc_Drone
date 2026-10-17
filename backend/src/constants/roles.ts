export const PLATFORM_ROLES = [
  'platform_super_admin',
  'platform_admin',
  'platform_support',
] as const;

export const ORG_ROLES = ['org_owner', 'org_admin', 'org_viewer'] as const;
export const STORE_ROLES = ['store_admin', 'customer'] as const;

export const ALL_ROLES = [...PLATFORM_ROLES, ...ORG_ROLES, ...STORE_ROLES] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];
export type OrgRole = (typeof ORG_ROLES)[number];
export type StoreRole = (typeof STORE_ROLES)[number];
export type Role = (typeof ALL_ROLES)[number];

export const isPlatformRole = (role: string): role is PlatformRole =>
  (PLATFORM_ROLES as readonly string[]).includes(role);

export const isOrgRole = (role: string): role is OrgRole =>
  (ORG_ROLES as readonly string[]).includes(role);

export const isStoreRole = (role: string): role is StoreRole =>
  (STORE_ROLES as readonly string[]).includes(role);

export const isReadOnlyRole = (role: string): boolean =>
  role === 'platform_support' || role === 'org_viewer' || role === 'customer';
