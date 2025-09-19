import { authClient } from '@/apps/shared/HttpClient/auth-client';
import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';
import { HEADERS } from '@/apps/main/auth/headers';
import { getRequestKey } from '../in/get-in-flight-request';
import { logout } from './auth/logout';

export const auth = {
  access,
  login,
  refresh,
  logout,
};

async function access(context: { email: string; password: string; tfa?: string }) {
  const method = 'POST';
  const endpoint = '/auth/login/access';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    authClient.POST(endpoint, {
      body: context,
      headers: HEADERS,
    });

  return await clientWrapper({
    sleepMs: 1_000,
    promiseFn,
    key,
    loggerBody: {
      msg: 'Access request',
      context: { email: context.email },
    },
  });
}

async function login(context: { email: string }) {
  const method = 'POST';
  const endpoint = '/auth/login';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    authClient.POST(endpoint, {
      body: { email: context.email },
      headers: HEADERS,
    });

  return await clientWrapper({
    sleepMs: 1_000,
    promiseFn,
    key,
    loggerBody: { msg: 'Login request', context },
  });
}

async function refresh() {
  const method = 'GET';
  const endpoint = '/users/refresh';
  const key = getRequestKey({ method, endpoint });

  const promiseFn = () => client.GET(endpoint);

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Refresh request',
      attributes: {
        tag: 'AUTH',
        method,
        endpoint,
      },
    },
  });
}
