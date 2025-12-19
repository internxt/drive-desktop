import { getUser } from '@/apps/main/auth/service';
import { electronStore } from '@/apps/main/config';
import { SavedConfig } from '@/core/electron/store/app-store.interface';

export function saveConfig() {
  const userUUID = getUser()?.uuid;

  if (!userUUID) {
    return;
  }

  const savedConfigs = electronStore.get('savedConfigs');

  const configToSave: SavedConfig = {
    backupInterval: electronStore.get('backupInterval'),
    backupList: electronStore.get('backupList'),
    deviceUuid: electronStore.get('deviceUuid'),
    lastBackup: electronStore.get('lastBackup'),
    syncRoot: electronStore.get('syncRoot'),
  };

  electronStore.set('savedConfigs', {
    ...savedConfigs,
    [userUUID]: configToSave,
  });
}
