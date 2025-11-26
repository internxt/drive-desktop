import { logger } from '@/apps/shared/logger/logger';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { refreshToken } from '../auth/refresh-token';
import { obtainToken } from '../auth/service';

const DAYS_BEFORE = 5;

export class TokenScheduler {
  timeout: NodeJS.Timeout | undefined;

  getExpiration() {
    const token = obtainToken();
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) throw new Error('Token does not have expiration time');
    return decoded.exp * 1000;
  }

  schedule() {
    try {
      const expirationDate = this.getExpiration();
      const renewDate = expirationDate - DAYS_BEFORE * 24 * 60 * 60 * 1000;
      const delayInMs = renewDate - Date.now();

      logger.debug({
        tag: 'AUTH',
        msg: 'Token renew date',
        expiresAt: new Date(expirationDate),
        renewAt: new Date(renewDate),
      });

      this.timeout = setTimeout(async () => {
        const isRefreshed = await refreshToken();
        if (isRefreshed) {
          this.schedule();
        }
      }, delayInMs);
    } catch (error) {
      logger.error({
        tag: 'AUTH',
        msg: 'Error scheduling refresh token',
        error,
      });
    }
  }

  stop() {
    clearTimeout(this.timeout);
  }
}
