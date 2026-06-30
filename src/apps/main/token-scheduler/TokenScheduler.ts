import jwtDecode, { JwtPayload } from 'jwt-decode';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { obtainToken, updateCredentials } from '../auth/service';

const TOKEN_RENEW_INTERVAL_4H_IN_MS = 4 * 60 * 60 * 1000;

export class TokenScheduler {
  static timeout: NodeJS.Timeout | undefined;

  private static getTokenExpirationTime() {
    const token = obtainToken();
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) throw new Error('Token does not have expiration time');

    return decoded.exp * 1000;
  }

  static getMillisecondsToExpire() {
    try {
      return this.getTokenExpirationTime() - Date.now();
    } catch (error) {
      logger.error({ tag: 'AUTH', msg: 'Error getting token', error });
      return null;
    }
  }

  static getMillisecondsToRenew() {
    try {
      const expiresAt = this.getTokenExpirationTime();
      const now = Date.now();
      const msToExpire = expiresAt - now;
      const msToRenew = this.getMillisecondsUntilNextRenew(msToExpire);
      const renewAt = now + msToRenew;

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
    this.stop();

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

  private static getMillisecondsUntilNextRenew(msToExpire: number) {
    if (msToExpire <= 0) return msToExpire;
    if (msToExpire <= TOKEN_RENEW_INTERVAL_4H_IN_MS) return 0;

    return TOKEN_RENEW_INTERVAL_4H_IN_MS;
  }
}
