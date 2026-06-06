/**
 * Shared authentication configuration.
 * All JWT and auth-related settings should be imported from here.
 */
export const JWT_SECRET = process.env.JWT_SECRET || 'gelatari-dev-secret-change-in-production';
export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '12', 10);
export const TOKEN_EXPIRY = (process.env.TOKEN_EXPIRY || '7d') as string;
export const MIN_PASSWORD_LENGTH = 8;
