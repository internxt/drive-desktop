import { logger } from '@internxt/drive-desktop-core/build/backend';
import { auth, TokenStatus } from '@internxt/lib';
import { obtainToken } from '../../../../../apps/main/auth/service';

export function validateTokenAndCheckExpiration(): { data: TokenStatus; error?: undefined } | { error: Error; data?: undefined } {
  try {
    const token = obtainToken();
    return { data: auth.validateTokenAndCheckExpiration(token) };
  } catch (error) {
    const tokenError = error instanceof Error ? error : new Error('Error getting token', { cause: error });
    logger.error({ tag: 'AUTH', msg: 'Error getting token', error: tokenError });
    return { error: tokenError };
  }
}
