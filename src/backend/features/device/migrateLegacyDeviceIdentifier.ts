import { logger } from '../../../core/LoggerService/LoggerService';
import { right } from './../../../context/shared/domain/Either';
import { driveServerModule } from './../../../infra/drive-server/drive-server.module';
import { Either, left } from './../../../context/shared/domain/Either';
import { Device } from './../../../apps/main/device/service';
import { getDeviceIdentifier } from './getDeviceIdentifier';
import configStore from './../../../apps/main/config';
import { mapDeviceDtoToDevice } from './utils/deviceMapper';

export async function migrateLegacyDeviceIdentifier(
  device: Device
): Promise<Either<Error, Device>> {
  const getDeviceIdentifierResult = getDeviceIdentifier();
  if (getDeviceIdentifierResult.isLeft()) {
    logger.warn({
      tag: 'BACKUP',
      msg: 'No valid identifier available for migration',
    });
    return right(device);
  }
  const deviceIdentifier = getDeviceIdentifierResult.getRight();

  const addIdentifierResult =
    await driveServerModule.backup.addDeviceIdentifier({
      key: deviceIdentifier.key,
      hostname: deviceIdentifier.hostname,
      platform: deviceIdentifier.platform,
      name: device.name,
      folderUuid: device.uuid,
    });

  if (addIdentifierResult.isRight()) {
    configStore.set('deviceId', -1);
    configStore.set('deviceUUID', '');
    logger.info({
      tag: 'BACKUP',
      msg: 'Successfully migrated legacy device identifier',
      device: addIdentifierResult.getRight(),
    });
    return right(addIdentifierResult.getRight());
  }
  const error = addIdentifierResult.getLeft();
  logger.warn({
    tag: 'BACKUP',
    msg: 'Failed to migrate legacy device identifier',
    error,
  });
  return left(error);
}
