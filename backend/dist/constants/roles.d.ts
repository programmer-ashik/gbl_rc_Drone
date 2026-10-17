export declare const PLATFORM_ROLES: readonly ["platform_super_admin", "platform_admin", "platform_support"];
export declare const ORG_ROLES: readonly ["org_owner", "org_admin", "org_viewer"];
export declare const ALL_ROLES: readonly ["platform_super_admin", "platform_admin", "platform_support", "org_owner", "org_admin", "org_viewer"];
export type PlatformRole = (typeof PLATFORM_ROLES)[number];
export type OrgRole = (typeof ORG_ROLES)[number];
export type Role = (typeof ALL_ROLES)[number];
export declare const isPlatformRole: (role: string) => role is PlatformRole;
export declare const isOrgRole: (role: string) => role is OrgRole;
export declare const isReadOnlyRole: (role: string) => boolean;
