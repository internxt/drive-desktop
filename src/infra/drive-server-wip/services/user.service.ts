import { AuthContext } from '@/apps/sync-engine/config';
import { clientWrapper } from '@/infra/drive-server-wip/in/client-wrapper.service';
import { getRequestKey } from '@/infra/drive-server-wip/in/get-in-flight-request';

export const user = {
  getUsage,
  getLimit,
};

async function getUsage({ ctx }: { ctx: AuthContext }) {
  const method = 'GET';
  const endpoint = '/users/usage';
  const key = getRequestKey({ method, endpoint });

  const promiseFn = () => ctx.client.GET(endpoint);

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Get usage request' },
  });
}

async function getLimit({ ctx }: { ctx: AuthContext }) {
  const method = 'GET';
  const endpoint = '/users/limit';
  const key = getRequestKey({ method, endpoint });

  const promiseFn = () => ctx.client.GET(endpoint);

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Get limit request' },
  });
}
