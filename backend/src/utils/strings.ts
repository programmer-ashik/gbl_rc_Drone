import crypto from 'node:crypto';

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const makeSlug = (value: string): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
