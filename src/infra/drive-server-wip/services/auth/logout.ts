import { AuthContext } from '@/apps/sync-engine/config';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';
import { noContentWrapper } from '../../in/no-content-wrapper.service';

export async function logout({ ctx }: { ctx: AuthContext }) {
  const method = 'GET';
  const endpoint = '/auth/logout';
  const key = getRequestKey({ method, endpoint });

  const promiseFn = () =>
    noContentWrapper({
      request: ctx.client.GET(endpoint),
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Logout request' },
  });
}
