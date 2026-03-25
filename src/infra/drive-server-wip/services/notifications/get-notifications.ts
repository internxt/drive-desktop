import { client } from '@/apps/shared/HttpClient/client';
import { components } from '@/apps/shared/HttpClient/schema';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';

export type MarketingNotification = components['schemas']['NotificationWithStatusDto'];

export async function getNotifications() {
  const method = 'GET';
  const endpoint = '/notifications';
  const key = getRequestKey({ method, endpoint });

  const promiseFn = () => client.GET(endpoint);

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Get notifications request' },
  });
}
