import { AuthContext } from '@/apps/sync-engine/config';
import { clientWrapper } from '../in/client-wrapper.service';
import { getRequestKey } from '../in/get-in-flight-request';
import { createDevice } from './backup/create-device';
import { fetchFolder } from './backup/fetch-folder';
import { getDevice } from './backup/get-device';
import { updateDevice } from './backup/update-device';

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
