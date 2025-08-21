import { getNewApiHeaders } from '../../../../apps/main/auth/service';
import { Either, left, right } from '../../../../context/shared/domain/Either';
import { driveServerClient } from '../../client/drive-server.client.instance';
import { components } from '../../../schemas';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { mapError } from '../utils/mapError';

export class UserService {
  async getUsage(): Promise<
    Either<Error, components['schemas']['GetUserUsageDto']>
  > {
    try {
      const response = await driveServerClient.GET('/users/usage', {
        headers: getNewApiHeaders(),
      });
      if (!response.data) {
        const error = logger.error({
          msg: 'Get usage request was not successful',
          attributes: { endpoint: '/users/usage' },
        });
        return left(error);
      }
      return right(response.data);
    } catch (err) {
      const error = mapError(err);
      const loggerError = logger.error({
        msg: 'Get usage request threw an exception',
        attributes: { endpoint: '/users/usage' },
        error,
      });
      return left(loggerError);
    }
  }
  async getLimit(): Promise<
    Either<Error, components['schemas']['GetUserLimitDto']>
  > {
    try {
      const response = await driveServerClient.GET('/users/limit', {
        headers: getNewApiHeaders(),
      });
      if (!response.data) {
        const error = logger.error({
          msg: 'Get limit request was not successful',
          attributes: { endpoint: '/users/limit' },
        });
        return left(error);
      }
      return right(response.data);
    } catch (err) {
      const error = mapError(err);
      const loggerError = logger.error({
        msg: 'Get limit request threw an exception',
        attributes: { endpoint: '/users/usage' },
        error,
      });
      return left(loggerError);
    }
  }
}

