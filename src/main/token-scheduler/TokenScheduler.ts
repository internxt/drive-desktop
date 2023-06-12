import Logger from 'electron-log';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import nodeSchedule from 'node-schedule';

const FIVE_SECONDS = 5 * 60;

export class TokenScheduler {
  private static MAX_TIME = 8640000000000000;

  constructor(
    private daysBefore: number,
    private tokens: Array<string>,
    private unauthorized: () => void
  ) {}

  private getExpiration(token: string): number {
    try {
      const decoded = jwtDecode<JwtPayload>(token);

      return decoded.exp || TokenScheduler.MAX_TIME;
    } catch (err) {
      Logger.error('[TOKEN] Token could be not decoded');

      return TokenScheduler.MAX_TIME;
    }
  }

  private nearestExpiration(): number {
    const expirations = this.tokens.map(this.getExpiration);

    return Math.min(...expirations);
  }

  private calculateRenewDate(expiration: number): Date {
    const renewSecondsBefore = this.daysBefore * 24 * 60 * 60;

    const renewDateInSeconds = expiration - renewSecondsBefore;

    if (renewDateInSeconds >= Date.now()) {
      return new Date(Date.now() + FIVE_SECONDS);
    }

    const date = new Date(0);
    date.setUTCSeconds(renewDateInSeconds);

    return date;
  }

  public schedule(fn: () => void) {
    const expiration = this.nearestExpiration();

    if (expiration === TokenScheduler.MAX_TIME) {
      Logger.warn('[TOKEN] Refresh token schedule will not be set');

      return;
    }

    if (expiration >= Date.now()) {
      Logger.warn('[TOKEN] TOKEN IS EXPIRED');
      this.unauthorized();

      return;
    }

    const renewDate = this.calculateRenewDate(expiration);

    Logger.info(
      '[TOKEN] Tokens will be refreshed on ',
      renewDate.toLocaleDateString()
    );

    return nodeSchedule.scheduleJob(renewDate, fn);
  }

  public cancelAll(): void {
    Object.keys(nodeSchedule.scheduledJobs).forEach((jobName: string) =>
      nodeSchedule.cancelJob(jobName)
    );
  }
}
