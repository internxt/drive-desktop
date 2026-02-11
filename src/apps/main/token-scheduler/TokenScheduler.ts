import { logger } from '@/apps/shared/logger/logger';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { obtainToken, updateCredentials } from '../auth/service';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

const DAYS_BEFORE = 1;

export class TokenScheduler {
  private static timeout: NodeJS.Timeout | undefined;

  static getTimeout() {
    return this.timeout;
  }

  static getExpiresAt() {
    const token = obtainToken();
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) throw new Error('Token does not have expiration time');
    return decoded.exp * 1000;
  }

  static getRenewAt() {
    const expiresAt = this.getExpiresAt();
    const renewAt = expiresAt - DAYS_BEFORE * 24 * 60 * 60 * 1000;
    const msToRenew = renewAt - Date.now();
    return { expiresAt, renewAt, msToRenew };
  }

  static schedule() {
    try {
      const { expiresAt, renewAt, msToRenew } = this.getRenewAt();

      logger.debug({
        tag: 'AUTH',
        msg: 'Token renew date',
        expiresAt: new Date(expiresAt),
        renewAt: new Date(renewAt),
      });

      this.timeout = setTimeout(async () => {
        const { data } = await driveServerWip.auth.refresh();

        if (data) {
          updateCredentials({ newToken: data.newToken });
          this.schedule();
        }
      }, msToRenew);
    } catch (error) {
      logger.error({
        tag: 'AUTH',
        msg: 'Error scheduling refresh token',
        error,
      });
    }
  }

  static stop() {
    clearTimeout(this.timeout);
  }
}
