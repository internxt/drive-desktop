import { left } from './../../../context/shared/domain/Either';
import { driveServerModule } from './../../../infra/drive-server/drive-server.module';
import { logger } from '../../../core/LoggerService/LoggerService'; //src/infra/drive-server/services/backup/backup.error'
import { BackupError } from '../../../infra/drive-server/services/backup/backup.error';
import { Either } from 'src/context/shared/domain/Either';
import { components } from 'src/infra/schemas';

export async function tryCreateDevice(deviceName: string): Promise<Either<Error, components['schemas']['DeviceDto']>> {
  const createDeviceEither = await driveServerModule.backup.createDevice(deviceName);

  if (createDeviceEither.isRight()) return createDeviceEither;

  const createDeviceError = createDeviceEither.getLeft();
  if (createDeviceError instanceof BackupError && createDeviceError?.code === 'ALREADY_EXISTS') {
    logger.info({
        tag: 'BACKUP',
        msg: 'Device name already exists',
        deviceName,
      });
    return createDeviceEither;
  };

  const errorMsg = 'Error creating device';
  const error = new Error(errorMsg);
  logger.error({
      tag: 'BACKUP',
      msg: errorMsg,
      error,
    });
  return left(error);
}

