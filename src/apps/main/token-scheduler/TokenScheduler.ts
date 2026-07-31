import { auth } from '@internxt/lib';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { MAX_TOKEN_SCHEDULER_TIMEOUT_DELAY_MS, validateToken } from '../../../backend/features/auth';
import { updateCredentials } from '../auth/service';

export class TokenScheduler {
  static timeout: NodeJS.Timeout | undefined;

  static schedule() {
    this.stop();

    const { data, error } = validateToken();
    if (error) {
      logger.error({ tag: 'AUTH', msg: 'Error while scheduling token', error });
      return;
    }

    const expiresAt = data.exp * 1000;
    const msToRenew = auth.calculateMillisecondsUntilRefresh(data.exp, data.iat);
    const timeoutDelay = Math.min(msToRenew, MAX_TOKEN_SCHEDULER_TIMEOUT_DELAY_MS);
    const renewAt = Date.now() + msToRenew;

    logger.debug({
      tag: 'AUTH',
      msg: 'Token renew date',
      expiresAt: new Date(expiresAt),
      renewAt: new Date(renewAt),
    });

    this.timeout = setTimeout(async () => {
      if (msToRenew > MAX_TOKEN_SCHEDULER_TIMEOUT_DELAY_MS) {
        this.schedule();
        return;
      }

      const { data } = await driveServerWip.auth.refresh();

      if (data) {
        updateCredentials({ newToken: data.newToken });
        this.schedule();
      }
    }, timeoutDelay);
  }

  static stop() {
    clearTimeout(this.timeout);
  }
}
