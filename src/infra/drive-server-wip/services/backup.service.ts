import { client } from '@/apps/shared/HttpClient/client';
import { ClientWrapperService } from '../in/client-wrapper.service';

export class BackupService {
  constructor(private readonly clientWrapper = new ClientWrapperService()) {}

  async getDevices() {
    const promise = client.GET('/backup/deviceAsFolder');

    return await this.clientWrapper.run({
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

  async getDevice({ deviceUuid }: { deviceUuid: string }) {
    const promise = client.GET('/backup/deviceAsFolder/{uuid}', {
      params: { path: { uuid: deviceUuid } },
    });

    return await this.clientWrapper.run({
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

  async createDevice({ deviceName }: { deviceName: string }) {
    const promise = client.POST('/backup/deviceAsFolder', {
      body: { deviceName },
    });

    return await this.clientWrapper.run({
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

  async updateDevice({ deviceUuid, deviceName }: { deviceUuid: string; deviceName: string }) {
    const promise = client.PATCH('/backup/deviceAsFolder/{uuid}', {
      params: { path: { uuid: deviceUuid } },
      body: { deviceName },
    });

    return await this.clientWrapper.run({
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
