import { client } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { noContentWrapper } from '../../in/no-content-wrapper.service';

export async function logout() {
  const method = 'GET';
  const endpoint = '/auth/logout';
  const key = getRequestKey({ method, endpoint });
  const promiseFn = () =>
    noContentWrapper({
      request: client.GET(endpoint),
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Logout request',
      attributes: {
        tag: 'AUTH',
        method,
        endpoint,
      },
    },
  });
}
