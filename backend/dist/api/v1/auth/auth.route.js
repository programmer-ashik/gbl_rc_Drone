import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler.js';
import { hashToken, makeSlug } from '../../../utils/strings.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth } from '../../../core/auth/middleware.js';
import { generateTokenPair, verifyRefreshToken } from '../../../core/auth/jwt.js';
import { BadRequestError, UnauthorizedError, ForbiddenError, } from '../../../core/http/errors.js';
import { isPlatformRole } from '../../../constants/roles.js';
import { UserModel } from '../users/user.model.js';
import { OrganizationModel } from '../organizations/organization.model.js';
import { auditLog } from '../../../core/logging/audit.js';
const registerSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    organizationName: z.string().min(1).optional(),
    organizationSlug: z.string().optional(),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    organizationSlug: z.string().optional(),
});
const refreshSchema = z.object({
    refreshToken: z.string().min(1),
});
const serializeUser = (user, org, meta = {}) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    context: isPlatformRole(user.role) ? 'platform' : 'org',
    organizationId: org?._id?.toString() ?? user.organizationId?.toString() ?? null,
    impersonating: meta.impersonating ?? false,
    organization: org
        ? {
            id: org._id.toString(),
            name: org.name,
            slug: org.slug,
            subscription: org.subscription,
            branding: org.branding,
        }
        : null,
});
const issueAuth = async (res, user, org, status, meta = {}) => {
    const tokens = generateTokenPair(user, {
        role: user.role,
        organizationId: org?._id?.toString() ?? null,
        impersonating: meta.impersonating,
    });
    await UserModel.findByIdAndUpdate(user._id, {
        refreshTokenHash: hashToken(tokens.refreshToken),
    });
    return res.status(status).json({
        success: true,
        data: {
            user: serializeUser(user, org, meta),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        },
    });
};
export const authRouter = Router();
authRouter.post('/register', zodValidate(registerSchema), asyncHandler(async (req, res) => {
    const { name, email, password, organizationName, organizationSlug } = req.body;
    const workspaceName = organizationName || `${name.trim()}'s Workspace`;
    const baseSlug = makeSlug(organizationSlug || workspaceName);
    if (!baseSlug)
        throw new BadRequestError('Valid organization name is required');
    let slug = baseSlug;
    let suffix = 1;
    while (await OrganizationModel.exists({ slug })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
    }
    const org = await OrganizationModel.create({ name: workspaceName, slug });
    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashed,
        role: 'org_owner',
        organizationId: org._id,
    });
    org.owner = user._id;
    await org.save();
    return issueAuth(res, user, org, 201);
}));
authRouter.post('/login', zodValidate(loginSchema), asyncHandler(async (req, res) => {
    const { email, password, organizationSlug } = req.body;
    const org = organizationSlug ? await OrganizationModel.findOne({ slug: organizationSlug }) : null;
    if (organizationSlug && !org)
        throw new UnauthorizedError('Invalid credentials');
    const filter = { email: email.toLowerCase() };
    if (org)
        filter.organizationId = org._id;
    const users = await UserModel.find(filter).limit(3).populate('organizationId');
    if (!organizationSlug && users.length > 1) {
        throw new BadRequestError('organizationSlug is required for this email');
    }
    const user = users[0];
    if (!user)
        throw new UnauthorizedError('Invalid credentials');
    const match = await bcrypt.compare(password, user.password);
    if (!match)
        throw new UnauthorizedError('Invalid credentials');
    const orgDoc = isPlatformRole(user.role)
        ? null
        : user.organizationId;
    if (!isPlatformRole(user.role) && (!orgDoc || orgDoc.status !== 'ACTIVE')) {
        throw new ForbiddenError('Organization is not active');
    }
    auditLog(req, {
        action: 'auth.login',
        targetType: 'User',
        targetId: user._id.toString(),
        organizationId: orgDoc?._id?.toString() ?? null,
    });
    return issueAuth(res, user, orgDoc, 200);
}));
authRouter.post('/refresh', zodValidate(refreshSchema), asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    }
    catch {
        throw new UnauthorizedError('Invalid refresh token');
    }
    const user = await UserModel.findById(decoded.sub).select('+refreshTokenHash +password').populate('organizationId');
    if (!user)
        throw new UnauthorizedError('User not found');
    if (!user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
        throw new UnauthorizedError('Refresh token revoked');
    }
    const orgDoc = isPlatformRole(user.role)
        ? null
        : user.organizationId;
    return issueAuth(res, user, orgDoc, 200);
}));
authRouter.post('/logout', requireAuth, asyncHandler(async (req, res) => {
    await UserModel.findByIdAndUpdate(req.auth.sub, { refreshTokenHash: null });
    auditLog(req, { action: 'auth.logout', targetType: 'User', targetId: req.auth.sub });
    envelope.ok(res, { loggedOut: true });
}));
authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.auth.sub).populate('organizationId');
    if (!user)
        throw new UnauthorizedError('User not found');
    const orgDoc = isPlatformRole(user.role)
        ? null
        : user.organizationId;
    envelope.ok(res, serializeUser(user, orgDoc, { impersonating: req.auth.impersonating }));
}));
//# sourceMappingURL=auth.route.js.map