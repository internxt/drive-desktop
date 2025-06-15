import { authClient } from '@/apps/shared/HttpClient/auth-client';
import { getHeaders } from '@/apps/shared/HttpClient/client';
import { loggerService } from '@/apps/shared/logger/logger';
import { clientWrapper } from '../in/client-wrapper.service';
import { HEADERS } from '@/apps/main/auth/headers';

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

  async refresh() {
    const promise = authClient.GET('/users/refresh', {
      headers: await getHeaders(),
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Refresh request was not successful',
        attributes: {
          tag: 'AUTH',
          endpoint: '/users/refresh',
        },
      },
    });
  }
}
