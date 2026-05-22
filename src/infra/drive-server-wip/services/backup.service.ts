import { AuthContext } from '@/apps/sync-engine/config';
import { clientWrapper } from '../in/client-wrapper.service';
import { getRequestKey } from '../in/get-in-flight-request';
import { createDevice } from './backup/create-device';
import { fetchFolder } from './backup/fetch-folder';
import { getDevice } from './backup/get-device';

export const backup = {
  getDevices,
  updateDevice,
  getDevice,
  createDevice,
  fetchFolder,
};

async function getDevices({ ctx }: { ctx: AuthContext }) {
  const method = 'GET';
  const endpoint = '/backup/deviceAsFolder';
  const key = getRequestKey({ method, endpoint });

  const promiseFn = () => ctx.client.GET(endpoint);

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Get devices as folder request' },
  });
}

export async function updateDevice({ ctx, context }: { ctx: AuthContext; context: { deviceUuid: string; deviceName: string } }) {
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
