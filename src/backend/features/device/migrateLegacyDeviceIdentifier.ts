import { logger } from '@internxt/drive-desktop-core/build/backend';
import { driveServerModule } from './../../../infra/drive-server/drive-server.module';
import { Device } from './../../../apps/main/device/service';
import { getDeviceIdentifier } from './getDeviceIdentifier';
import configStore from './../../../apps/main/config';
import { BackupError } from '../../../infra/drive-server/services/backup/backup.error';

type Props = {
  device: Device;
};

export async function migrateLegacyDeviceIdentifier({ device }: Props) {
  const { error, data } = getDeviceIdentifier();
  if (error) {
    logger.warn({
      tag: 'BACKUPS',
      msg: 'No valid identifier available for migration',
    });
    return { data: device };
  }

  const addIdentifierResult = await driveServerModule.backup.addDeviceIdentifier({
    key: data.key,
    hostname: data.hostname,
    platform: data.platform,
    name: device.name,
    folderUuid: device.uuid,
  });

  const migrationError = addIdentifierResult.getLeft();
  const isSuccessful =
    addIdentifierResult.isRight() ||
    (migrationError instanceof BackupError && migrationError.code === 'ALREADY_EXISTS');

  if (isSuccessful) {
    configStore.set('deviceId', -1);
    configStore.set('deviceUUID', '');

    const migratedDevice = addIdentifierResult.isRight() ? addIdentifierResult.getRight() : device;

    logger.debug({
      tag: 'BACKUPS',
      msg: 'Successfully migrated legacy device identifier',
      device: migratedDevice,
    });
    return { data: migratedDevice };
  }

  logger.warn({
    tag: 'BACKUPS',
    msg: 'Failed to migrate legacy device identifier',
    error: migrationError,
  });
  return { data: device };
}
