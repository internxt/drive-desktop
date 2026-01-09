import { TokenScheduler } from '../../token-scheduler/TokenScheduler';
import { onUserUnauthorized } from '../handlers';
import { obtainTokens as obtainStoredTokens } from '../service';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { refreshToken } from './refresh-token';

const CREATE_SCHEDULE_RETRY_LIMIT = 3;

type Props = {
  refreshedTokens?: Array<string | undefined>;
};

export async function createTokenScheduleWithRetry({ refreshedTokens }: Props = {}) {
  const tokens = refreshedTokens || obtainStoredTokens();
  const tokenScheduler = new TokenScheduler(5, tokens, onUserUnauthorized);

  let attempt = 0;
  while (attempt < CREATE_SCHEDULE_RETRY_LIMIT) {
    const schedule = tokenScheduler.schedule(() => refreshToken());
    if (schedule) break;

    attempt++;
    logger.debug({
      tag: 'AUTH',
      msg: '[TOKEN] Failed to create token schedule, retrying...',
    });
  }
}
