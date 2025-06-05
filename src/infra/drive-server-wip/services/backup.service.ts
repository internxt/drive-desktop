import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';

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

  getDevice({ deviceUuid }: { deviceUuid: string }) {
    const promise = client.GET('/backup/deviceAsFolder/{uuid}', {
      params: { path: { uuid: deviceUuid } },
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Get device as folder request was not successful',
        context: {
          deviceUuid,
        },
        attributes: {
          method: 'GET',
          endpoint: '/backup/deviceAsFolder/{uuid}',
        },
      },
    });
  }

  createDevice({ deviceName }: { deviceName: string }) {
    const promise = client.POST('/backup/deviceAsFolder', {
      body: { deviceName },
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Create device as folder request was not successful',
        context: {
          deviceName,
        },
        attributes: {
          method: 'POST',
          endpoint: '/backup/deviceAsFolder',
        },
      },
    });
  }

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
