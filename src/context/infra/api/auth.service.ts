import { inspect } from 'node:util';
import packageConfig from '../../../../package.json';
import { authClient } from '../../../apps/shared/HttpClient/auth-client';
import { logger } from '@/apps/shared/logger/logger';

const HEADERS = {
  'content-type': 'application/json',
  'internxt-client': 'drive-desktop',
  'internxt-version': packageConfig.version,
};

export class AuthService {
  static async access({ email, password, tfa }: { email: string; password: string; tfa?: string }) {
    const res = await authClient.POST('/auth/login/access', {
      body: { email, password, tfa },
      headers: HEADERS,
    });

    if (!res.data) {
      logger.error({
        tag: 'AUTH',
        msg: 'Access request was not successful',
        endpoint: '/auth/login/access',
        error: res.error,
      });
      throw new Error('Access request was not successful');
    }

    return res.data;
  }

  static async login({ email }: { email: string }) {
    const res = await authClient.POST('/auth/login', {
      body: { email },
      headers: HEADERS,
    });

    if (!res.data) {
      logger.error(
        inspect({
          tag: 'AUTH',
          msg: 'Login request was not successful',
          endpoint: '/auth/login',
          error: res.error,
        }),
      );
      throw new Error('Login request was not successful');
    }

    return res.data;
  }
}
