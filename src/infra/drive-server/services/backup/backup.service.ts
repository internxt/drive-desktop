import { driveServerClient } from '../../client/drive-server.client.instance';
import { getNewApiHeaders } from '../../../../apps/main/auth/service';
import { Either, left, right } from '../../../../context/shared/domain/Either';
import { logger } from '../../../../core/LoggerService/LoggerService';
import { components, operations } from '../../../schemas';
import { mapError } from '../utils/mapError';
import { AxiosError } from 'axios';
import { BackupError } from './backup.error';
import { mapDeviceAsFolderToDevice } from 'src/backend/features/device/utils/deviceMapper';
import { Device } from '../../../../apps/main/device/service';

type getDevicesByIdentifierQuery = operations['BackupController_getDevicesAndFolders']['parameters']['query'];

export class BackupService {
  async getDevices(): Promise<
    Either<Error, Array<Device>>
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
      return right(response.data.map(mapDeviceAsFolderToDevice));
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
  ): Promise<Either<Error, Device>> {
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
      return right(mapDeviceAsFolderToDevice(response.data));
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        const notFoundError = BackupError.notFound('Device not found');
        logger.error({
          msg: 'Device not found (404)',
          tag: 'BACKUP',
          attributes: {
            endpoint: '/backup/deviceAsFolder/{uuid}',
          },
        });
        return left(notFoundError);
      }

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
  ): Promise<Either<Error, Device>> {
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
      return right(mapDeviceAsFolderToDevice(response.data));
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        const notFoundError = BackupError.notFound('Device by not found');
        logger.error({
          msg: 'Device by id not found (404)',
          tag: 'BACKUP',
          attributes: {
            endpoint: '/backup/deviceAsFolderById/{id}',
          },
        });
        return left(notFoundError);
      }

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
  ): Promise<Either<Error, Device>> {
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
          new BackupError('Create device as folder request was not successful')
        );
      }
      return right(mapDeviceAsFolderToDevice(response.data));
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 409) {
        const alreadyExistsError = BackupError.alreadyExists(
          'Device already exists'
        );
        logger.error({
          msg: 'Device already exists (409)',
          tag: 'BACKUP',
          attributes: {
            endpoint: '/backup/deviceAsFolder',
          },
        });
        return left(alreadyExistsError);
      }

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
  ): Promise<Either<Error, Device>> {
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
        return left(
          new Error('Update device as folder request was not successful')
        );
      }
      return right(mapDeviceAsFolderToDevice(response.data));
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

  async getDevicesByIdentifier(
    query: getDevicesByIdentifierQuery
  ): Promise<Either<Error, Array<Device>>> {
    try {
      const response = await driveServerClient.GET('/backup/v2/devices', {
        headers: getNewApiHeaders(),
        query,
      });
      if (!response.data) {
        logger.error({
          msg: 'Get devices by identifier request was not successful',
          tag: 'BACKUP',
          attributes: { endpoint: '/backup/v2/devices' },
        });
        return left(
          new Error('Get devices by identifier request was not successful')
        );
      }
      return right(
        response.data.map(({ folder }) => mapDeviceAsFolderToDevice(folder!))
      );
    } catch (err) {
      const error = mapError(err);
      logger.error({
        msg: 'Get devices by identifier request threw an exception',
        tag: 'BACKUP',
        error: error,
        attributes: { endpoint: '/backup/v2/devices' },
      });
      return left(error);
    }
  }

  async addDeviceIdentifier(
    body: components['schemas']['CreateDeviceAndAttachFolderDto']
  ): Promise<Either<Error, Device>> {
    try {
      const response = await driveServerClient.POST(
        '/backup/v2/devices/migrate',
        {
          headers: getNewApiHeaders(),
          body,
        }
      );
      if (!response.data) {
        const error = new Error(
          'Add device identifier request was not successful'
        );
        logger.error({
          msg: error.message,
          tag: 'BACKUP',
        });
        return left(error);
      }
      return right(mapDeviceAsFolderToDevice(response.data.folder!));
    } catch (err) {
      const error = mapError(err);
      logger.error({
        msg: 'Add device identifier request threw an exception',
        tag: 'BACKUP',
        error,
      });
      return left(error);
    }
  }

  async createDeviceWithIdentifier(
    body: components['schemas']['CreateDeviceAndFolderDto']
  ): Promise<Either<Error, Device>> {
    try {
      const response = await driveServerClient.POST('/backup/v2/devices', {
        headers: getNewApiHeaders(),
        body,
      });
      if (!response.data) {
        const error = new Error(
          'Create device with identifier request was not successful'
        );
        logger.error({
          msg: error.message,
          tag: 'BACKUP',
        });
        return left(error);
      }
      return right(mapDeviceAsFolderToDevice(response.data.folder!));
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 409) {
        const alreadyExistsError = BackupError.alreadyExists(
          'Device already exists'
        );
        logger.error({
          msg: 'Device already exists (409)',
          tag: 'BACKUP',
          attributes: {
            endpoint: '/backup/v2/devices',
          },
        });
        return left(alreadyExistsError);
      }

      const error = mapError(err);
      logger.error({
        msg: 'Create device as folder request threw an exception',
        tag: 'BACKUP',
        error: error,
        attributes: {
          endpoint: '/backup/v2/devices',
        },
      });
      return left(error);
    }
  }
}
