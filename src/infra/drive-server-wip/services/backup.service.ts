import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';
import { createDevice } from './backup/create-device';
import { getDevice } from './backup/get-device';
import { getRequestKey } from '../in/get-in-flight-request';
import { fetchFolder } from './backup/fetch-folder';
import { getDeviceByIdentifier } from './backup/get-device-by-identifier';
import { addIdentifierToDevice } from './backup/add-identifier-to-device';
import { createDeviceWithIdentifier } from './backup/create-device-with-identifier';

export const backup = {
  getDevices,
  updateDevice,
  getDevice,
  createDevice,
  addIdentifierToDevice,
  createDeviceWithIdentifier,
  getDeviceByIdentifier,
  fetchFolder,
};

async function getDevices() {
  const method = 'GET';
  const endpoint = '/backup/deviceAsFolder';
  const key = getRequestKey({ method, endpoint });

  const promiseFn = () => client.GET(endpoint);

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get devices as folder request',
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function updateDevice(context: { deviceUuid: string; deviceName: string }) {
  const method = 'PATCH';
  const endpoint = '/backup/deviceAsFolder/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.PATCH(endpoint, {
      params: { path: { uuid: context.deviceUuid } },
      body: { deviceName: context.deviceName },
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Update device as folder request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}
