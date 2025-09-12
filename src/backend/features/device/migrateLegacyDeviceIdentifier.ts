import { logger } from '@internxt/drive-desktop-core/build/backend';
import { right } from './../../../context/shared/domain/Either';
import { driveServerModule } from './../../../infra/drive-server/drive-server.module';
import { Either } from './../../../context/shared/domain/Either';
import { Device } from './../../../apps/main/device/service';
import { getDeviceIdentifier } from './getDeviceIdentifier';
import configStore from './../../../apps/main/config';
import { BackupError } from '../../../infra/drive-server/services/backup/backup.error';

export async function migrateLegacyDeviceIdentifier(
  device: Device
): Promise<Either<Error, Device>> {
  const getDeviceIdentifierResult = getDeviceIdentifier();
  if (getDeviceIdentifierResult.isLeft()) {
    logger.warn({
      tag: 'BACKUPS',
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
    logger.debug({
      tag: 'BACKUPS',
      msg: 'Successfully migrated legacy device identifier',
      device: addIdentifierResult.getRight(),
    });
    return right(addIdentifierResult.getRight());
  }
  const error = addIdentifierResult.getLeft();
  if (error instanceof BackupError && error.code === 'ALREADY_EXISTS') {
    configStore.set('deviceId', -1);
    configStore.set('deviceUUID', '');
    logger.debug({
      tag: 'BACKUPS',
      msg: 'Successfully migrated legacy device identifier',
      device: addIdentifierResult.getRight(),
    });
    return right(device);
  }
  logger.warn({
    tag: 'BACKUPS',
    msg: 'Failed to migrate legacy device identifier',
    error,
  });
  return right(device);
}
