import { auth } from '@internxt/lib';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { validateToken } from '../../../backend/features/auth/services/token/validate-token';
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
    const renewAt = Date.now() + msToRenew;

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
  }

  static stop() {
    clearTimeout(this.timeout);
  }
}
