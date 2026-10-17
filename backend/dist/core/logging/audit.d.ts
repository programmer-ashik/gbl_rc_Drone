import type { Request } from 'express';
export interface AuditPayload {
    action: string;
    targetType?: string;
    targetId?: string;
    organizationId?: string | null;
    metadata?: Record<string, unknown>;
}
export declare const auditLog: (req: Request, payload: AuditPayload) => void;
