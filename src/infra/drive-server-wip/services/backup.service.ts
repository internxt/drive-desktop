import { client } from '@/apps/shared/HttpClient/client';
import { loggerService } from '@/apps/shared/logger/logger';

export class BackupService {
  constructor(private readonly logger = loggerService) {}

  async getDevices() {
    const res = await client.GET('/backup/deviceAsFolder');

    if (!res.data) {
      return {
        error: this.logger.error({
          msg: 'Get devices as folder request was not successful',
          exc: res.error,
          attributes: {
            method: 'GET',
            endpoint: '/backup/deviceAsFolder',
          },
        }),
      };
    }

    return { data: res.data };
  }

  async getDevice({ deviceUuid }: { deviceUuid: string }) {
    const res = await client.GET('/backup/deviceAsFolder/{uuid}', {
      params: { path: { uuid: deviceUuid } },
    });

    if (!res.data) {
      return {
        error: this.logger.error({
          msg: 'Get device as folder request was not successful',
          exc: res.error,
          attributes: {
            method: 'GET',
            endpoint: '/backup/deviceAsFolder/{uuid}',
          },
        }),
      };
    }

    return { data: res.data };
  }

  async createDevice({ deviceName }: { deviceName: string }) {
    const res = await client.POST('/backup/deviceAsFolder', {
      body: { deviceName },
    });

    if (!res.data) {
      return {
        error: this.logger.error({
          msg: 'Create device as folder request was not successful',
          exc: res.error,
          context: {
            deviceName,
          },
          attributes: {
            method: 'POST',
            endpoint: '/backup/deviceAsFolder',
          },
        }),
      };
    }

    return { data: res.data };
  }

  async updateDevice({ deviceUuid, deviceName }: { deviceUuid: string; deviceName: string }) {
    const res = await client.PATCH('/backup/deviceAsFolder/{uuid}', {
      params: { path: { uuid: deviceUuid } },
      body: { deviceName },
    });

    if (!res.data) {
      return {
        error: this.logger.error({
          msg: 'Update device as folder request was not successful',
          exc: res.error,
          context: {
            deviceUuid,
            deviceName,
          },
          attributes: {
            method: 'PATCH',
            endpoint: '/backup/deviceAsFolder/{uuid}',
          },
        }),
      };
    }

    return { data: res.data };
  }
}
