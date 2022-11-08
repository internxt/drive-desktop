import jwtDecode, { JwtPayload } from 'jwt-decode';
import nodeSchedule from 'node-schedule';
import Logger from 'electron-log';

export class TokenScheduler {
  private static MAX_TIME = 8640000000000000;

  constructor(private daysBefore: number, private tokens: Array<string>) {}

  private getExpiration(token: string): number {
    try {
      const decoded = jwtDecode<JwtPayload>(token);

      return decoded.exp || TokenScheduler.MAX_TIME;
    } catch (err) {
      Logger.error('[TOKEN] Token could be not decoded', token);
      return TokenScheduler.MAX_TIME;
    }
  }

  private nearestExpiration(): number {
    const expirations = this.tokens.map(this.getExpiration);

    return Math.min(...expirations);
  }

  private expToDate(exp: number): Date {
    const date = new Date(0);
    date.setUTCSeconds(exp);

    return date;
  }

  public schedule(fn: () => void) {
    const expiration = this.nearestExpiration();

    if (expiration === TokenScheduler.MAX_TIME) {
      Logger.warn('[TOKEN] Refresh token schedule will not be set');
      return;
    }

    const renewDate = this.expToDate(
      expiration - this.daysBefore * 24 * 60 * 60
    );

    Logger.info(
      '[TOKEN] Tokens will be refreshed on ',
      renewDate.toLocaleDateString()
    );

    return nodeSchedule.scheduleJob(renewDate, fn);
  }
}
