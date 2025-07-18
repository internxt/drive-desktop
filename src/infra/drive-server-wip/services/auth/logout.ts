import { client } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { noContentWrapper } from '../../in/no-content-wrapper.service';
import { DriveServerWipError } from '../../out/error.types';

export async function logout() {
  const method = 'GET';
  const endpoint = '/auth/logout';
  const key = getRequestKey({ method, endpoint });
  const promiseFn = () =>
    noContentWrapper({
      request: client.GET(endpoint),
    });

  const { data, error } = await clientWrapper({
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

  if (error?.code === 'UNKNOWN') {
    switch (true) {
      case error.response?.status === 401:
        return { error: new DriveServerWipError('UNAUTHORIZED', error.cause) };
    }
  }

  return { data, error };
}
