import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';
import { getRequestKey } from '../in/get-in-flight-request';
import { logout } from './auth/logout';

export const auth = {
  refresh,
  logout,
};

async function refresh() {
  const method = 'GET';
  const endpoint = '/users/refresh';
  const key = getRequestKey({ method, endpoint });

  const promiseFn = () => client.GET(endpoint);

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Refresh request' },
  });
}
