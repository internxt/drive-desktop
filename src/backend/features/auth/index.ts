export { validateTokenAndCheckExpiration } from './services/token/validate-token-and-check-expiration';
export { validateToken } from './services/token/validate-token';

/**
 * v2.6.13 Alexis Mora
 * Node.js reduces setTimeout delays above this signed 32-bit limit to 1 ms.
 */
export const MAX_TOKEN_SCHEDULER_TIMEOUT_DELAY_MS = 2 ** 31 - 1;
