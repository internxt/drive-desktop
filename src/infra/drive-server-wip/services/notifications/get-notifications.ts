import { components } from '@/apps/shared/HttpClient/schema';
import { AuthContext } from '@/apps/sync-engine/config';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';

export type MarketingNotification = components['schemas']['NotificationWithStatusDto'];

export async function getNotifications({ ctx }: { ctx: AuthContext }) {
  const method = 'GET';
  const endpoint = '/notifications';
  const key = getRequestKey({ method, endpoint });

  const promiseFn = () => ctx.client.GET(endpoint);

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Get notifications request' },
  });
}
