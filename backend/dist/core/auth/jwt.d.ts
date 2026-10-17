import jwt from 'jsonwebtoken';
import type { AuthContext } from '../../types/express.js';
interface TokenUser {
    _id: {
        toString(): string;
    };
    email: string;
    role: string;
    organizationId?: {
        toString(): string;
    } | string | null;
    organization?: {
        _id?: {
            toString(): string;
        };
    } | string | null;
}
export declare const buildAccessPayload: (user: TokenUser, options?: {
    role?: string;
    organizationId?: string | null;
    impersonating?: boolean;
}) => AuthContext;
export declare const generateAccessToken: (user: TokenUser, options?: Parameters<typeof buildAccessPayload>[1]) => string;
export declare const generateRefreshToken: (user: TokenUser) => string;
export declare const generateTokenPair: (user: TokenUser, options?: Parameters<typeof buildAccessPayload>[1]) => {
    accessToken: string;
    refreshToken: string;
};
export declare const verifyAccessToken: (token: string) => AuthContext;
export declare const verifyRefreshToken: (token: string) => jwt.JwtPayload;
export {};
