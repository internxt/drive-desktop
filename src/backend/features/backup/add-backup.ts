import configStore from '../../../apps/main/config';
import { createBackup } from './create-backup';
import { DeviceModule } from '../../../backend/features/device/device.module';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { enableExistingBackup } from './enable-existing-backup';
import { getPathFromDialog } from '../../../core/utils/get-path-from-dialog';
import { createAbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { Result } from '../../../context/shared/domain/Result';
import { BackupInfo } from '../../../apps/backups/BackupInfo';

export async function addBackup(): Promise<Result<BackupInfo, Error>> {
  const { error, data } = await DeviceModule.getOrCreateDevice();
  if (error) {
    logger.error({ tag: 'BACKUPS', msg: 'Error fetching or creating device', error });
    return { error: new Error('Error adding backup: No device found') };
  }

  const chosenItem = await getPathFromDialog();
  if (!chosenItem) return { error: new Error('No path chosen') };

  const chosenPath = createAbsolutePath(chosenItem.path);
  const backupList = configStore.get('backupList');
  const existingBackup = backupList[chosenPath];

  if (!existingBackup) {
    const { data: newBackup, error: createError } = await createBackup({ pathname: chosenPath, device: data });
    if (createError) {
      logger.error({ tag: 'BACKUPS', msg: 'Error creating backup', error: createError });
      return { error: createError };
    }
    return { data: newBackup };
  } else {
    const { data: existingBackupInfo, error: enableError } = await enableExistingBackup({
      pathname: chosenPath,
      device: data,
    });
    if (enableError) {
      logger.error({ tag: 'BACKUPS', msg: 'Error enabling existing backup', error: enableError });
      return { error: enableError };
    }
    return { data: existingBackupInfo };
  }
}
