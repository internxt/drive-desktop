import { TokenScheduler } from '../../token-scheduler/TokenScheduler';
import { onUserUnauthorized } from '../handlers';
import {
  obtainTokens as obtainStoredTokens,
  updateCredentials,
} from '../service';
import { driveServerModule } from '../../../../infra/drive-server/drive-server.module';
import { Either, left, right } from '../../../../context/shared/domain/Either';
import { RefreshTokenResponse } from '../../../../infra/drive-server/services/auth/auth.types';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export async function obtainTokens(): Promise<
  Either<Error, RefreshTokenResponse>
> {
  try {
    const result = await driveServerModule.auth.refresh();
    if (result.isLeft()) {
      onUserUnauthorized();
    }
    return result;
  } catch (err) {
    logger.error({
      msg: '[TOKEN] Could not obtain tokens',
      error: err,
      tag: 'AUTH',
    });
    return left(err as Error);
  }
}

export async function refreshToken(): Promise<Either<Error, Array<string>>> {
  const response = await obtainTokens();

  if (response.isLeft()) {
    return left(response.getLeft());
  }

  const { token, newToken } = response.getRight();

  updateCredentials(token, newToken);

  return right([token, newToken]);
}

export async function createTokenSchedule(
  refreshedTokens?: Array<string>
): Promise<void> {
  const tokens = refreshedTokens || obtainStoredTokens();

  const tokenScheduler = new TokenScheduler(5, tokens, onUserUnauthorized);
  const schedule = tokenScheduler.schedule(() => {
    refreshToken().catch((err) => {
      logger.error({
        msg: '[TOKEN] Unexpected error during refresh',
        error: err,
      });
    });
  });

  if (!schedule && !refreshedTokens) {
    logger.debug({
      msg: '[TOKEN] Failed to create token schedule',
      tag: 'AUTH',
    });

    const result = await refreshToken();

    if (result.isRight()) {
      await createTokenSchedule(result.getRight());
    } else {
      logger.error({
        msg: '[TOKEN] Failed to refresh tokens after schedule failure',
        error: result.getLeft(),
      });
    }
  }
}
