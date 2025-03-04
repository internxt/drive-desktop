import packageConfig from '../../../../package.json';
import { authClient } from '../../../apps/shared/HttpClient/auth-client';
import { logger } from '../../../apps/shared/logger/logger';

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
      throw logger.error({
        msg: 'Access request was not successful',
        error: res.error,
        attributes: {
          tag: 'AUTH',
          endpoint: '/auth/login/access',
        },
      });
    }

    return res.data;
  }

  static async login({ email }: { email: string }) {
    const res = await authClient.POST('/auth/login', {
      body: { email },
      headers: HEADERS,
    });

    if (!res.data) {
      throw logger.error({
        msg: 'Login request was not successful',
        error: res.error,
        attributes: {
          tag: 'AUTH',
          endpoint: '/auth/login',
        },
      });
    }

    return res.data;
  }
}
