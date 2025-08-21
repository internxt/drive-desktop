import { Device } from './../../../apps/main/device/service';
import { left, right } from './../../../context/shared/domain/Either';
import { driveServerModule } from './../../../infra/drive-server/drive-server.module';
import { logger } from '../../../core/LoggerService/LoggerService';
import { BackupError } from '../../../infra/drive-server/services/backup/backup.error';
import { Either } from './../../../context/shared/domain/Either';
import { DeviceIdentifierDTO } from './device.types';


export async function tryCreateDevice(
  deviceName: string, deviceIdentifier: DeviceIdentifierDTO
): Promise<Either<Error, Device>> {
  const createDeviceEither =
    await driveServerModule.backup.createDeviceWithIdentifier({
      name: deviceName,
      key: deviceIdentifier.key,
      hostname: deviceIdentifier.hostname,
      platform: deviceIdentifier.platform
    });

  if (createDeviceEither.isRight()) return right(createDeviceEither.getRight());

  const createDeviceError = createDeviceEither.getLeft();
  if (createDeviceError instanceof BackupError && createDeviceError?.code === 'ALREADY_EXISTS') {
    logger.info({
        tag: 'BACKUP',
        msg: 'Device name already exists',
        deviceName,
      });
    return left(createDeviceEither.getLeft());
  };

  const error = new Error('Error creating device');
  logger.error({
    tag: 'BACKUP',
    msg: error.message,
    error,
  });
  return left(error);
}

