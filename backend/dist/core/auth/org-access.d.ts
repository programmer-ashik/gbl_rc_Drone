import type { Request } from 'express';
export declare const assertOrgAccess: (req: Request, organizationId: unknown, options?: {
    notFound?: boolean;
}) => string;
export declare const assertOrgWriteAccess: (req: Request, organizationId: unknown) => string;
export declare const assertPlatformWriteAccess: (req: Request) => void;
export declare const withOrgScope: (req: Request, filter?: Record<string, unknown>) => {
    [x: string]: unknown;
} | {
    organizationId: string;
};
