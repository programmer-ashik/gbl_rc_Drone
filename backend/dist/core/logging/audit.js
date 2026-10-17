import { AuditLogModel } from '../../api/v1/audit-logs/audit-log.model.js';
export const auditLog = (req, payload) => {
    if (!req.auth)
        return;
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
//# sourceMappingURL=audit.js.map