import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '@/infra/drive-server-wip/in/client-wrapper.service';
import { getRequestKey } from '@/infra/drive-server-wip/in/get-in-flight-request';

export const user = {
  getUsage,
  getLimit,
};

async function getUsage() {
  const method = 'GET';
  const endpoint = '/users/usage';
  const key = getRequestKey({ method, endpoint });

  const promiseFn = () => client.GET(endpoint);

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get usage request',
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function getLimit() {
  const method = 'GET';
  const endpoint = '/users/limit';
  const key = getRequestKey({ method, endpoint });

  const promiseFn = () => client.GET(endpoint);

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get limit request',
      attributes: {
        method,
        endpoint,
      },
    },
  });
}
