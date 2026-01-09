import { onUserUnauthorized } from '../handlers';
import { updateCredentials } from '../service';
import { Either, left, right } from '../../../../context/shared/domain/Either';
import { driveServerModule } from '../../../../infra/drive-server/drive-server.module';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export async function refreshToken(): Promise<Either<Error, Array<string | undefined>>> {
  const result = await driveServerModule.auth.refresh();
  if (result.isLeft()) {
    const error = result.getLeft();
    logger.error({
      tag: 'AUTH',
      msg: '[TOKEN] Could not refresh token, unauthorized user',
      error,
    });
    onUserUnauthorized();
    return left(error);
  }

  const { token, newToken } = result.getRight();

  updateCredentials(token, newToken);

  return right([token, newToken]);
}
