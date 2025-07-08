import { authClient } from './auth.client';
import {
  getBaseApiHeaders,
  getNewApiHeaders,
} from '../../../../apps/main/auth/service';
import { logger } from '../../../../core/LoggerService/LoggerService';
import { Either, left, right } from '../../../../context/shared/domain/Either';
import {
  LoginAccessRequest,
  LoginAccessResponse,
  LoginResponse,
  RefreshTokenResponse,
} from './auth.types';
import { mapError } from '../utils/mapError';

export class AuthService {
  async access(
    credentials: LoginAccessRequest
  ): Promise<Either<Error, LoginAccessResponse>> {
    const { email, password, tfa } = credentials;
    try {
      const response = await authClient.POST('/auth/login/access', {
        body: { email, password, tfa },
        headers: getBaseApiHeaders(),
      });

      if (!response.data) {
        logger.error({
          msg: 'Access request was not successful',
          tag: 'AUTH',
          attributes: { endpoint: '/auth/login/access' },
        });
        return left(new Error('Access request was not successful'));
      }
      return right(response.data);
    } catch (err) {
      const error = mapError(err);
      logger.error({
        msg: 'Access request threw an exception',
        tag: 'AUTH',
        error: error,
        attributes: {
          endpoint: '/auth/login/access',
        },
      });
      return left(error);
    }
  }

  async login(email: string): Promise<Either<Error, LoginResponse>> {
    try {
      const response = await authClient.POST('/auth/login', {
        body: { email },
        headers: getBaseApiHeaders(),
      });

      if (!response.data) {
        logger.error({
          msg: 'Login request was not successful',
          tag: 'AUTH',
          attributes: { endpoint: '/auth/login' },
        });
        return left(new Error('Login request was not successful'));
      }
      return right(response.data);
    } catch (err) {
      const error = mapError(err);
      logger.error({
        msg: 'Login request threw an exception',
        tag: 'AUTH',
        error: error,
        attributes: {
          endpoint: '/auth/login',
        },
      });
      return left(error);
    }
  }

  async refresh(): Promise<Either<Error, RefreshTokenResponse>> {
    try {
      const response = await authClient.GET('/users/refresh', {
        headers: await getNewApiHeaders(),
      });

      if (!response.data) {
        logger.error({
          msg: 'Refresh request was not successful',
          tag: 'AUTH',
          attributes: {
            endpoint: '/users/refresh',
          },
        });
        return left(new Error('Refresh request was not successful'));
      }
      return right(response.data);
    } catch (err) {
      const error = mapError(err);
      logger.error({
        msg: 'Login request threw an exception',
        tag: 'AUTH',
        error: error,
        attributes: {
          endpoint: '/auth/login',
        },
      });
      return left(error);
    }
  }

  async logout(): Promise<Either<Error, boolean>> {
    const headers = getNewApiHeaders();
    try {
      const response = await authClient.GET('/auth/logout', {
        headers,
      });

      if (!response.data) {
        logger.error({
          msg: 'Logout request was not successful',
          tag: 'AUTH',
          attributes: { endpoint: '/auth/logout' },
        });
        return left(new Error('Logout request was not successful'));
      }
      return right(true);
    } catch (err) {
      const error = mapError(err);
      logger.error({
        msg: 'Logout request threw an exception',
        tag: 'AUTH',
        error: error,
        attributes: {
          endpoint: '/auth/logout',
        },
      });
      return left(error);
    }
  }
}
