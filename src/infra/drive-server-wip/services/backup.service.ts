import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';
import { createDevice } from './backup/create-device';
import { getDevice } from './backup/get-device';

export class BackupService {
  async getDevices() {
    const promise = client.GET('/backup/deviceAsFolder');

    return await clientWrapper({
      promise: () => promise,
      loggerBody: {
        msg: 'Get devices as folder request',
        attributes: {
          method: 'GET',
          endpoint: '/backup/deviceAsFolder',
        },
      },
    });
  }

  getDevice = getDevice;
  createDevice = createDevice;

  async updateDevice(context: { deviceUuid: string; deviceName: string }) {
    const promise = client.PATCH('/backup/deviceAsFolder/{uuid}', {
      params: { path: { uuid: context.deviceUuid } },
      body: { deviceName: context.deviceName },
    });

    return await clientWrapper({
      promise: () => promise,
      loggerBody: {
        msg: 'Update device as folder request',
        context,
        attributes: {
          method: 'PATCH',
          endpoint: '/backup/deviceAsFolder/{uuid}',
        },
      },
    });
  }
}
