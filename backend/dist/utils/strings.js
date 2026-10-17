import crypto from 'node:crypto';
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
export const makeSlug = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
//# sourceMappingURL=strings.js.map