export const PLATFORM_ROLES = [
    'platform_super_admin',
    'platform_admin',
    'platform_support',
];
export const ORG_ROLES = ['org_owner', 'org_admin', 'org_viewer'];
export const STORE_ROLES = ['store_admin', 'customer'];
export const ALL_ROLES = [...PLATFORM_ROLES, ...ORG_ROLES, ...STORE_ROLES];
export const isPlatformRole = (role) => PLATFORM_ROLES.includes(role);
export const isOrgRole = (role) => ORG_ROLES.includes(role);
export const isStoreRole = (role) => STORE_ROLES.includes(role);
export const isReadOnlyRole = (role) => role === 'platform_support' || role === 'org_viewer' || role === 'customer';
