import { logger } from '@/apps/shared/logger/logger';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { obtainToken, updateCredentials } from '../auth/service';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

const DAYS_BEFORE = 1;

export class TokenScheduler {
  static timeout: NodeJS.Timeout | undefined;

  static getMillisecondsToRenew() {
    try {
      const token = obtainToken();
      const decoded = jwtDecode<JwtPayload>(token);
      if (!decoded.exp) throw new Error('Token does not have expiration time');

      const expiresAt = decoded.exp * 1000;
      const renewAt = expiresAt - DAYS_BEFORE * 24 * 60 * 60 * 1000;
      const msToRenew = renewAt - Date.now();

      logger.debug({
        tag: 'AUTH',
        msg: 'Token renew date',
        expiresAt: new Date(expiresAt),
        renewAt: new Date(renewAt),
        msToRenew,
      });

      return msToRenew;
    } catch (error) {
      logger.error({ tag: 'AUTH', msg: 'Error getting token', error });
      return null;
    }
  }

  static schedule() {
    const msToRenew = this.getMillisecondsToRenew();
    if (msToRenew === null) return;

    this.timeout = setTimeout(async () => {
      const { data } = await driveServerWip.auth.refresh();

      if (data) {
        updateCredentials({ newToken: data.newToken });
        this.schedule();
      }
    }, msToRenew);
  }

  static stop() {
    clearTimeout(this.timeout);
  }
}
