import { client } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { components } from '@/apps/shared/HttpClient/schema';

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
