import { authClient } from '@/apps/shared/HttpClient/auth-client';
import { loggerService } from '@/apps/shared/logger/logger';
import { INTERNXT_VERSION } from '@/core/utils/utils';

const HEADERS = {
  'content-type': 'application/json',
  'internxt-client': 'drive-desktop',
  'internxt-version': INTERNXT_VERSION,
};

export class AuthService {
  constructor(private readonly logger = loggerService) {}

  async access({ email, password, tfa }: { email: string; password: string; tfa?: string }) {
    const res = await authClient.POST('/auth/login/access', {
      body: { email, password, tfa },
      headers: HEADERS,
    });

    if (!res.data) {
      throw this.logger.error({
        msg: 'Access request was not successful',
        error: res.error,
        context: {
          email,
        },
        attributes: {
          tag: 'AUTH',
          endpoint: '/auth/login/access',
        },
      });
    }

    return res.data;
  }

  async login({ email }: { email: string }) {
    const res = await authClient.POST('/auth/login', {
      body: { email },
      headers: HEADERS,
    });

    if (!res.data) {
      throw this.logger.error({
        msg: 'Login request was not successful',
        error: res.error,
        context: {
          email,
        },
        attributes: {
          tag: 'AUTH',
          endpoint: '/auth/login',
        },
      });
    }

    return res.data;
  }
}
