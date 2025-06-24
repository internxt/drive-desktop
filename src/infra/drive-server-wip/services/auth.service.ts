import { authClient } from '@/apps/shared/HttpClient/auth-client';
import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';
import { HEADERS } from '@/apps/main/auth/headers';

export const auth = {
  access,
  login,
  refresh,
};

async function access({ email, password, tfa }: { email: string; password: string; tfa?: string }) {
  const promise = () =>
    authClient.POST('/auth/login/access', {
      body: { email, password, tfa },
      headers: HEADERS,
    });

  const { data, error } = await clientWrapper({
    promise,
    sleepMs: 1_000,
    loggerBody: {
      msg: 'Access request',
      context: {
        email,
      },
      attributes: {
        tag: 'AUTH',
        endpoint: '/auth/login/access',
      },
    },
  });

  if (error) throw error;
  return data;
}

async function login(context: { email: string }) {
  const promise = () =>
    authClient.POST('/auth/login', {
      body: { email: context.email },
      headers: HEADERS,
    });

  const { data, error } = await clientWrapper({
    promise,
    sleepMs: 1_000,
    loggerBody: {
      msg: 'Login request',
      context,
      attributes: {
        tag: 'AUTH',
        endpoint: '/auth/login',
      },
    },
  });

  if (error) throw error;
  return data;
}

async function refresh() {
  const promise = () => client.GET('/users/refresh');

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Refresh request',
      attributes: {
        tag: 'AUTH',
        endpoint: '/users/refresh',
      },
    },
  });
}
