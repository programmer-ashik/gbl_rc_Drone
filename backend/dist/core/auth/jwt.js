import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../../config/env.js';
export const buildAccessPayload = (user, options = {}) => {
    const organizationId = options.organizationId ??
        (typeof user.organization === 'object' && user.organization?._id
            ? user.organization._id.toString()
            : typeof user.organization === 'string'
                ? user.organization
                : user.organizationId
                    ? String(user.organizationId)
                    : null);
    return {
        sub: user._id.toString(),
        email: user.email,
        role: options.role ?? user.role,
        organizationId: organizationId ?? null,
        impersonating: options.impersonating ?? false,
    };
};
export const generateAccessToken = (user, options = {}) => jwt.sign(buildAccessPayload(user, options), config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRY,
});
export const generateRefreshToken = (user) => jwt.sign({ sub: user._id.toString(), type: 'refresh', jti: crypto.randomUUID() }, config.JWT_SECRET, { expiresIn: config.JWT_REFRESH_EXPIRY });
export const generateTokenPair = (user, options = {}) => ({
    accessToken: generateAccessToken(user, options),
    refreshToken: generateRefreshToken(user),
});
export const verifyAccessToken = (token) => {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (decoded.type === 'refresh') {
        throw new Error('Refresh token cannot be used as access token');
    }
    return {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        organizationId: decoded.organizationId ?? null,
        impersonating: decoded.impersonating ?? false,
    };
};
export const verifyRefreshToken = (token) => {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
    }
    return decoded;
};
//# sourceMappingURL=jwt.js.map