import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../../config/env.js';
import type { AuthContext } from '../../types/express.js';

interface TokenUser {
  _id: { toString(): string };
  email: string;
  role: string;
  organizationId?: { toString(): string } | string | null;
  organization?: { _id?: { toString(): string } } | string | null;
}

export const buildAccessPayload = (
  user: TokenUser,
  options: { role?: string; organizationId?: string | null; impersonating?: boolean } = {},
): AuthContext => {
  const organizationId =
    options.organizationId ??
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

export const generateAccessToken = (
  user: TokenUser,
  options: Parameters<typeof buildAccessPayload>[1] = {},
): string =>
  jwt.sign(buildAccessPayload(user, options), config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
  });

export const generateRefreshToken = (user: TokenUser): string =>
  jwt.sign(
    { sub: user._id.toString(), type: 'refresh', jti: crypto.randomUUID() },
    config.JWT_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'] },
  );

export const generateTokenPair = (
  user: TokenUser,
  options: Parameters<typeof buildAccessPayload>[1] = {},
) => ({
  accessToken: generateAccessToken(user, options),
  refreshToken: generateRefreshToken(user),
});

export const verifyAccessToken = (token: string): AuthContext => {
  const decoded = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload & AuthContext;
  if (decoded.type === 'refresh') {
    throw new Error('Refresh token cannot be used as access token');
  }
  return {
    sub: decoded.sub!,
    email: decoded.email as string,
    role: decoded.role as string,
    organizationId: (decoded.organizationId as string | null) ?? null,
    impersonating: decoded.impersonating ?? false,
  };
};

export const verifyRefreshToken = (token: string): jwt.JwtPayload => {
  const decoded = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload;
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }
  return decoded;
};
