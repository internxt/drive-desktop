import { driveServerClient } from '../../client/drive-server.client.instance';
import { getNewApiHeaders } from '../../../../apps/main/auth/service';
import { Either, left, right } from '../../../../context/shared/domain/Either';
import { logger } from '../../../../core/LoggerService/LoggerService';
import { components } from '../../../schemas';
import { mapError } from '../utils/mapError';

export class BackupService {
  async getDevices(): Promise<
    Either<Error, Array<components['schemas']['DeviceDto']>>
  > {
    try {
      const response = await driveServerClient.GET('/backup/deviceAsFolder', {
        headers: getNewApiHeaders(),
      });
      if (!response.data) {
        logger.error({
          msg: 'Get devices as folder request was not successful',
          tag: 'BACKUP',
          attributes: { endpoint: '/backup/deviceAsFolder' },
        });
        return left(
          new Error('Get devices as folder request was not successful')
        );
      }
      return right(response.data);
    } catch (err) {
      const error = mapError(err);
      logger.error({
        msg: 'Get devices as folder request request threw an exception',
        tag: 'BACKUP',
        error: error,
        attributes: {
          endpoint: '/backup/deviceAsFolder',
        },
      });
      return left(error);
    }
  }

  async getDevice(
    deviceUUID: string
  ): Promise<Either<Error, components['schemas']['DeviceDto']>> {
    try {
      const response = await driveServerClient.GET(
        '/backup/deviceAsFolder/{uuid}',
        {
          path: { uuid: deviceUUID },
          headers: getNewApiHeaders(),
        }
      );

      if (!response.data) {
        logger.error({
          msg: 'Get device as folder request was not successful',
          tag: 'BACKUP',
          attributes: { endpoint: '/backup/deviceAsFolder/{uuid}' },
        });
        return left(
          new Error('Get device as folder request was not successful')
        );
      }
      return right(response.data);
    } catch (err) {
      const error = mapError(err);
      logger.error({
        msg: 'Get device as folder request threw an exception',
        tag: 'BACKUP',
        error: error,
        attributes: {
          endpoint: '/backup/deviceAsFolder/{uuid}',
        },
      });
      return left(error);
    }
  }

  /*
   * @Deprecated
   * Please use the method getDevice instead
   * */
  async getDeviceById(
    deviceId: string
  ): Promise<Either<Error, components['schemas']['DeviceDto']>> {
    try {
      const response = await driveServerClient.GET(
        '/backup/deviceAsFolderById/{id}',
        {
          path: { id: deviceId },
          headers: getNewApiHeaders(),
        }
      );
      if (!response.data) {
        logger.error({
          msg: 'Get device as folder by id request was not successful',
          tag: 'BACKUP',
          attributes: { endpoint: '/backup/deviceAsFolderById/{id}' },
        });
        return left(
          new Error('Get device as folder by id request was not successful')
        );
      }
      return right(response.data);
    } catch (err) {
      const error = mapError(err);
      logger.error({
        msg: 'Get device as folder by id request threw an exception',
        tag: 'BACKUP',
        error: error,
        attributes: {
          endpoint: '/backup/deviceAsFolderById/{id}',
        },
      });
      return left(error);
    }
  }

  async createDevice(
    deviceName: string
  ): Promise<Either<Error, components['schemas']['DeviceDto']>> {
    try {
      const response = await driveServerClient.POST('/backup/deviceAsFolder', {
        headers: getNewApiHeaders(),
        body: { deviceName },
      });
      if (!response.data) {
        logger.error({
          msg: 'Create device as folder request was not successful',
          tag: 'BACKUP',
          context: { deviceName },
          attributes: { endpoint: '/backup/deviceAsFolder' },
        });
        return left(
          new Error('Create device as folder request was not successful')
        );
      }
      return right(response.data);
    } catch (err) {
      const error = mapError(err);
      logger.error({
        msg: 'Create device as folder request threw an exception',
        tag: 'BACKUP',
        error: error,
        attributes: {
          endpoint: '/backup/deviceAsFolder',
        },
      });
      return left(error);
    }
  }

  async updateDevice(
    deviceUUID: string,
    deviceName: string
  ): Promise<Either<Error, components['schemas']['DeviceDto']>> {
    try {
      const response = await driveServerClient.PATCH(
        '/backup/deviceAsFolder/{uuid}',
        {
          path: { uuid: deviceUUID },
          headers: getNewApiHeaders(),
          body: { deviceName },
        }
      );

      if (!response.data) {
        logger.error({
          msg: 'Update device as folder request was not successful',
          tag: 'BACKUP',
          context: { deviceUUID, deviceName },
          attributes: { endpoint: '/backup/deviceAsFolder/{uuid}' },
        });
        return left(new Error('Update device as folder request was not successful'));
      }
      return right(response.data);
    } catch (err) {
      const error = mapError(err);
      logger.error({
        msg: 'Update device as folder request threw an exception',
        tag: 'BACKUP',
        error: error,
        attributes: {
          endpoint: '/backup/deviceAsFolder/{uuid}',
        },
      });
      return left(error);
    }
  }
}
