import { getPathFromDialog } from '../device/service';
import configStore from '../config';
import { createBackup } from './create-backup';
import { DeviceModule } from '../../../backend/features/device/device.module';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { enableExistingBackup } from './enable-existing-backup';

export async function addBackup() {
  const { error, data } = await DeviceModule.getOrCreateDevice();
  if (error) {
    throw logger.error({ tag: 'BACKUPS', msg: 'Error adding backup: No device found' });
  }

  const chosenItem = await getPathFromDialog();
  if (!chosenItem || !chosenItem.path) return;

  const chosenPath = chosenItem.path;
  const backupList = configStore.get('backupList');
  const existingBackup = backupList[chosenPath];

  if (!existingBackup) {
    return await createBackup({ pathname: chosenPath, device: data });
  } else {
    return await enableExistingBackup(chosenPath, data);
  }
}
