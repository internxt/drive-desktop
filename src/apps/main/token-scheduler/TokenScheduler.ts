import { logger } from '@/apps/shared/logger/logger';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import nodeSchedule from 'node-schedule';
import { onUserUnauthorized } from '../auth/handlers';

const DAYS_BEFORE = 5;
const FIVE_SECONDS = 5 * 60;

export class TokenScheduler {
  private static MAX_TIME = 8640000000000000;

  constructor(private token: string) {}

  private getExpiration(): number {
    try {
      const decoded = jwtDecode<JwtPayload>(this.token);

      return decoded.exp || TokenScheduler.MAX_TIME;
    } catch (exc) {
      logger.error({ msg: '[TOKEN] Token could be not decoded', exc });
      return TokenScheduler.MAX_TIME;
    }
  }

  private calculateRenewDate(expiration: number): Date {
    const renewSecondsBefore = DAYS_BEFORE * 24 * 60 * 60;

    const renewDateInSeconds = expiration - renewSecondsBefore;

    if (renewDateInSeconds >= Date.now()) {
      return new Date(Date.now() + FIVE_SECONDS);
    }

    const date = new Date(0);
    date.setUTCSeconds(renewDateInSeconds);

    return date;
  }

  public schedule(fn: () => void) {
    const expiration = this.getExpiration();

    if (expiration === TokenScheduler.MAX_TIME) {
      logger.warn({ msg: '[TOKEN] Refresh token schedule will not be set' });

      return;
    }

    if (expiration >= Date.now()) {
      logger.warn({ msg: '[TOKEN] TOKEN IS EXPIRED' });
      onUserUnauthorized();

      return;
    }

    const renewDate = this.calculateRenewDate(expiration);

    logger.debug({ msg: '[TOKEN] Tokens will be refreshed on ', renewDate: renewDate.toLocaleDateString() });

    return nodeSchedule.scheduleJob(renewDate, fn);
  }

  public cancelAll(): void {
    Object.keys(nodeSchedule.scheduledJobs).forEach((jobName) => nodeSchedule.cancelJob(jobName));
  }
}
