import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../../utils/async-handler.js";
import { hashToken, makeSlug } from "../../../utils/strings.js";
import { envelope } from "../../../core/http/middleware.js";
import { zodValidate } from "../../../core/http/validate.js";
import { requireAuth } from "../../../core/auth/middleware.js";
import {
  generateTokenPair,
  verifyRefreshToken,
} from "../../../core/auth/jwt.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "../../../core/http/errors.js";
import { isPlatformRole } from "../../../constants/roles.js";
import { UserModel } from "../users/user.model.js";
import { OrganizationModel } from "../organizations/organization.model.js";
import { auditLog } from "../../../core/logging/audit.js";
import { config } from "../../../config/env.js";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
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

const profileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const serializeUser = (
  user: InstanceType<typeof UserModel>,
  org: InstanceType<typeof OrganizationModel> | null,
  meta: { impersonating?: boolean } = {},
) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  context: isPlatformRole(user.role) ? "platform" : "org",
  organizationId:
    org?._id?.toString() ?? user.organizationId?.toString() ?? null,
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

const issueAuth = async (
  res: Parameters<typeof envelope.ok>[0],
  user: InstanceType<typeof UserModel>,
  org: InstanceType<typeof OrganizationModel> | null,
  status: number,
  meta: { impersonating?: boolean } = {},
) => {
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

authRouter.post(
  "/register",
  zodValidate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, organizationSlug } = req.body as z.infer<
      typeof registerSchema
    >;
    const slug = makeSlug(
      organizationSlug || config.DEFAULT_ORG_SLUG || "gblrcdrone",
    );
    if (!slug)
      throw new BadRequestError("Default organization slug is required");
    const org = await OrganizationModel.findOne({ slug });
    if (!org) throw new NotFoundError("Default organization not found");
    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashed,
      role: "customer",
      organizationId: org._id,
    });

    return issueAuth(res, user, org, 201);
  }),
);

authRouter.post(
  "/login",
  zodValidate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password, organizationSlug } = req.body as z.infer<
      typeof loginSchema
    >;
    console.log(email, password);
    const loginSlug = makeSlug(
      organizationSlug || config.DEFAULT_ORG_SLUG || "",
    );
    const org = loginSlug
      ? await OrganizationModel.findOne({ slug: loginSlug })
      : null;
    if (organizationSlug && !org)
      throw new UnauthorizedError("Invalid credentials");

    const filter: Record<string, unknown> = { email: email.toLowerCase() };
    if (organizationSlug && org) {
      filter.organizationId = org._id;
    } else if (org) {
      filter.$or = [{ organizationId: org._id }, { organizationId: null }];
    }

    const users = await UserModel.find(filter)
      .select("+password +refreshTokenHash")
      .limit(3)
      .populate("organizationId");
    if (!organizationSlug && users.length > 1) {
      const defaultOrgUser = users.find((item) => {
        const orgId = (
          item.organizationId as { _id?: { toString(): string } } | null
        )?._id?.toString();
        return orgId && org?._id && orgId === org._id.toString();
      });
      if (!defaultOrgUser) {
        throw new BadRequestError(
          "organizationSlug is required for this email",
        );
      }
      users.splice(0, users.length, defaultOrgUser);
    }
    const user = users[0];
    if (!user) throw new UnauthorizedError("Invalid credentials");

    let matchedUser = user;
    let match = user.password
      ? await bcrypt.compare(password, user.password)
      : false;
    if (!match) {
      for (const candidate of users.slice(1)) {
        if (
          candidate.password &&
          (await bcrypt.compare(password, candidate.password))
        ) {
          matchedUser = candidate;
          match = true;
          break;
        }
      }
    }
    if (!match) throw new UnauthorizedError("Invalid credentials");
    if ((matchedUser as { isBlocked?: boolean }).isBlocked) {
      throw new ForbiddenError("Account is blocked");
    }

    const orgDoc = isPlatformRole(matchedUser.role)
      ? null
      : (matchedUser.organizationId as InstanceType<
          typeof OrganizationModel
        > | null);
    if (
      !isPlatformRole(matchedUser.role) &&
      (!orgDoc || orgDoc.status !== "ACTIVE")
    ) {
      throw new ForbiddenError("Organization is not active");
    }

    auditLog(req, {
      action: "auth.login",
      targetType: "User",
      targetId: matchedUser._id.toString(),
      organizationId: orgDoc?._id?.toString() ?? null,
    });

    return issueAuth(res, matchedUser, orgDoc, 200);
  }),
);

authRouter.post(
  "/refresh",
  zodValidate(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const user = await UserModel.findById(decoded.sub)
      .select("+refreshTokenHash +password")
      .populate("organizationId");
    if (!user) throw new UnauthorizedError("User not found");
    if (
      !user.refreshTokenHash ||
      user.refreshTokenHash !== hashToken(refreshToken)
    ) {
      throw new UnauthorizedError("Refresh token revoked");
    }

    const orgDoc = isPlatformRole(user.role)
      ? null
      : (user.organizationId as InstanceType<typeof OrganizationModel> | null);

    return issueAuth(res, user, orgDoc, 200);
  }),
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await UserModel.findByIdAndUpdate(req.auth!.sub, {
      refreshTokenHash: null,
    });
    auditLog(req, {
      action: "auth.logout",
      targetType: "User",
      targetId: req.auth!.sub,
    });
    envelope.ok(res, { loggedOut: true });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.auth!.sub).populate(
      "organizationId",
    );
    if (!user) throw new UnauthorizedError("User not found");
    const orgDoc = isPlatformRole(user.role)
      ? null
      : (user.organizationId as InstanceType<typeof OrganizationModel> | null);
    envelope.ok(
      res,
      serializeUser(user, orgDoc, { impersonating: req.auth!.impersonating }),
    );
  }),
);

authRouter.get(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.auth!.sub).populate(
      "organizationId",
    );
    if (!user) throw new UnauthorizedError("User not found");
    const orgDoc = isPlatformRole(user.role)
      ? null
      : (user.organizationId as InstanceType<typeof OrganizationModel> | null);
    envelope.ok(
      res,
      serializeUser(user, orgDoc, { impersonating: req.auth!.impersonating }),
    );
  }),
);

authRouter.put(
  "/profile",
  requireAuth,
  zodValidate(profileUpdateSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body as z.infer<typeof profileUpdateSchema>;
    if (!payload.name && !payload.email) {
      throw new BadRequestError("Nothing to update");
    }
    if (payload.email) payload.email = payload.email.toLowerCase();

    const user = await UserModel.findByIdAndUpdate(req.auth!.sub, payload, {
      new: true,
    })
      .select("+password +refreshTokenHash")
      .populate("organizationId");
    if (!user) throw new UnauthorizedError("User not found");

    auditLog(req, {
      action: "auth.profile_update",
      targetType: "User",
      targetId: user._id.toString(),
    });
    const orgDoc = isPlatformRole(user.role)
      ? null
      : (user.organizationId as InstanceType<typeof OrganizationModel> | null);
    envelope.ok(
      res,
      serializeUser(user, orgDoc, { impersonating: req.auth!.impersonating }),
    );
  }),
);
