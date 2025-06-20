import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';
import { createDevice } from './backup/create-device';
import { getDevice } from './backup/get-device';

export class BackupService {
  getDevices() {
    const promise = client.GET('/backup/deviceAsFolder');

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Get devices as folder request was not successful',
        attributes: {
          method: 'GET',
          endpoint: '/backup/deviceAsFolder',
        },
      },
    });
  }

  getDevice = getDevice;
  createDevice = createDevice;

  updateDevice({ deviceUuid, deviceName }: { deviceUuid: string; deviceName: string }) {
    const promise = client.PATCH('/backup/deviceAsFolder/{uuid}', {
      params: { path: { uuid: deviceUuid } },
      body: { deviceName },
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Update device as folder request was not successful',
        context: {
          deviceUuid,
          deviceName,
        },
        attributes: {
          method: 'PATCH',
          endpoint: '/backup/deviceAsFolder/{uuid}',
        },
      },
    });
  }
}
