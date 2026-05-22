import { AuthContext } from '@/apps/sync-engine/config';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';

type Props = {
  ctx: AuthContext;
  context: { deviceUuid: string; deviceName: string };
};

export async function updateDevice({ ctx, context }: Props) {
  const method = 'PATCH';
  const endpoint = '/backup/deviceAsFolder/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    ctx.client.PATCH(endpoint, {
      params: { path: { uuid: context.deviceUuid } },
      body: { deviceName: context.deviceName },
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Update device as folder request', context },
  });
}
