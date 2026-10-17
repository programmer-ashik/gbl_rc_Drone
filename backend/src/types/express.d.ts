import type { Request } from 'express';

export interface AuthContext {
  sub: string;
  email: string;
  role: string;
  organizationId: string | null;
  impersonating?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      auth?: AuthContext;
    }
  }
}

export type { Request };
