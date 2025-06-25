import configStore from '@/apps/main/config';
import { logger } from '@/apps/shared/logger/logger';
import { createNewDevice } from '@/backend/features/backups/device/in/create-new-device';
import { fetchDevice } from '@/backend/features/backups/device/in/fetch-device';

export async function getOrCreateDevice() {
  const savedDeviceUuid = configStore.get('deviceUuid');
  const deviceIsStored = savedDeviceUuid !== '';
  logger.debug({ tag: 'BACKUPS', msg: 'Saved device', savedDeviceUuid });

  if (!deviceIsStored) {
    logger.debug({ tag: 'BACKUPS', msg: 'No saved device, creating a new one' });
    return createNewDevice();
  }
  const { data, error } = await fetchDevice({ deviceUuid: savedDeviceUuid });
  if (data && !data.removed) {
    return { data };
  }

  if (data == null && !error) {
    logger.debug({ tag: 'BACKUPS', msg: 'Device not found, creating a new one' });
    return createNewDevice();
  }

  if (error) {
    logger.error({ tag: 'BACKUPS', msg: 'Error fetching device', error });
    return { error };
  }
  return { error: logger.error({ tag: 'BACKUPS', msg: 'Unknown error: Device not found or removed' }) };
}
