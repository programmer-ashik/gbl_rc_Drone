import type { Request } from 'express';
import { AuditLogModel } from '../../api/v1/audit-logs/audit-log.model.js';

export interface AuditPayload {
  action: string;
  targetType?: string;
  targetId?: string;
  organizationId?: string | null;
  metadata?: Record<string, unknown>;
}

export const auditLog = (req: Request, payload: AuditPayload): void => {
  if (!req.auth) return;

  void AuditLogModel.create({
    organizationId: payload.organizationId ?? req.auth.organizationId,
    actorId: req.auth.sub,
    actorEmail: req.auth.email,
    action: payload.action,
    targetType: payload.targetType ?? null,
    targetId: payload.targetId ?? null,
    metadata: payload.metadata ?? {},
    requestId: req.requestId ?? null,
  }).catch((err) => console.error('auditLog failed', err));
};
