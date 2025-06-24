import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '@/infra/drive-server-wip/in/client-wrapper.service';

export const user = {
  getUsage,
  getLimit,
};

async function getUsage() {
  const promise = () => client.GET('/users/usage');

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get usage request',
      attributes: {
        method: 'GET',
        endpoint: '/users/usage',
      },
    },
  });
}

async function getLimit() {
  const promise = () => client.GET('/users/limit');

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get limit request',
      attributes: {
        method: 'GET',
        endpoint: '/users/limit',
      },
    },
  });
}
