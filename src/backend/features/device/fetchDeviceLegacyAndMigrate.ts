import { fetchDevice, FetchDeviceProps } from './fetchDevice';
import { migrateLegacyDeviceIdentifier } from './migrateLegacyDeviceIdentifier';
import configStore from '../../../apps/main/config';
import { BackupError } from '../../../infra/drive-server/services/backup/backup.error';

export async function fetchDeviceLegacyAndMigrate(props: FetchDeviceProps) {
  const { error, data } = await fetchDevice(props);
  if (error) {
    if (error instanceof BackupError && error.code === 'NOT_FOUND') {
      configStore.set('deviceId', -1);
      configStore.set('deviceUUID', '');
    }

    return { error };
  }

  return await migrateLegacyDeviceIdentifier({ device: data });
}
