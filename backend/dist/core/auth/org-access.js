import mongoose from 'mongoose';
import { isOrgRole, isPlatformRole, isReadOnlyRole } from '../../constants/roles.js';
import { ForbiddenError, BadRequestError, NotFoundError } from '../http/errors.js';
const asId = (value) => {
    if (!value)
        return null;
    if (typeof value === 'object' && value !== null && '_id' in value) {
        return String(value._id);
    }
    return String(value);
};
export const assertOrgAccess = (req, organizationId, options = {}) => {
    const role = req.auth?.role;
    const requested = asId(organizationId);
    if (!requested || !mongoose.Types.ObjectId.isValid(requested)) {
        throw new BadRequestError('Invalid organization id');
    }
    if (role && isPlatformRole(role))
        return requested;
    if (role &&
        isOrgRole(role) &&
        asId(req.auth?.organizationId) === requested) {
        return requested;
    }
    if (options.notFound)
        throw new NotFoundError();
    throw new ForbiddenError('Organization access denied');
};
export const assertOrgWriteAccess = (req, organizationId) => {
    const role = req.auth?.role ?? '';
    assertOrgAccess(req, organizationId);
    if (isReadOnlyRole(role))
        throw new ForbiddenError('Write access denied');
    return asId(organizationId);
};
export const assertPlatformWriteAccess = (req) => {
    const role = req.auth?.role ?? '';
    if (!isPlatformRole(role) || role === 'platform_support') {
        throw new ForbiddenError('Platform write access denied');
    }
};
export const withOrgScope = (req, filter = {}) => {
    const role = req.auth?.role;
    if (role && isPlatformRole(role)) {
        const queryOrg = req.query.organizationId;
        if (!queryOrg)
            return { ...filter };
        if (!mongoose.Types.ObjectId.isValid(queryOrg)) {
            throw new BadRequestError('Invalid organization id');
        }
        return { ...filter, organizationId: queryOrg };
    }
    if (!req.auth?.organizationId) {
        throw new ForbiddenError('Organization context is required');
    }
    return { ...filter, organizationId: req.auth.organizationId };
};
//# sourceMappingURL=org-access.js.map