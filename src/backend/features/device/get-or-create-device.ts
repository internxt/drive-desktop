import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import configStore from '@/apps/main/config';
import { logger } from '@/apps/shared/logger/logger';
import { createNewDevice, Device, fetchDevice } from '@/apps/main/device/service';
import { getDeviceIdentifier } from '@/backend/features/device/get-device-identifier';
import { fetchDeviceByIdentifier } from '@/backend/features/device/fetch-device-by-identifier';

/*
 * v2.5.5
 * Alexis Mora
 * This whole functionality of saving the deviceUuid in the configStore
 * must be removed in favor of the new machineGuid in one year since the release of v2.5.6
 * */
export async function getOrCreateDevice() {
  const savedDeviceUuid = configStore.get('deviceUuid');

  if (savedDeviceUuid) {
    logger.debug({ tag: 'BACKUPS', msg: 'Saved device found in configStore', savedDeviceUuid });
    const { data, error } = await fetchDevice({ deviceUuid: savedDeviceUuid });
    return handleDeviceFetchResult({ device: data, error, migrate: true });
  }
  const result = await fetchDeviceByIdentifier();
  return handleDeviceFetchResult(result);
}

async function handleDeviceFetchResult({ device, error, migrate = false }: { device?: Device | null; error?: Error; migrate?: boolean }) {
  if (device && !device.removed) {
    if (migrate) {
      return await migrateLegacyDeviceIdentifier({ device });
    }
    return { data: device };
  }

  if (!device && !error) {
    logger.debug({ tag: 'BACKUPS', msg: 'Device not found, creating a new one' });
    return await createNewDevice();
  }

  const fallbackError = error ?? new Error('Unknown error: Device not found or removed');
  return { error: logger.error({ tag: 'BACKUPS', msg: fallbackError.message, error: fallbackError }) };
}

async function migrateLegacyDeviceIdentifier({ device }: { device: Device }) {
  const { deviceIdentifier, error } = getDeviceIdentifier();
  if (error) {
    logger.warn({ tag: 'BACKUPS', msg: 'No valid identifier available for migration' });
    return { data: device };
  }

  const identifier = {
    uuid: device.uuid,
    ...deviceIdentifier,
  };

  const { data, error: addIdentifierError } = await driveServerWipModule.backup.addIdentifierToExistingDevice(identifier);

  if (!addIdentifierError) {
    configStore.delete('deviceUuid');
    logger.info({
      tag: 'BACKUPS',
      msg: 'Successfully migrated legacy device identifier',
      identifier,
    });
  } else {
    logger.warn({
      tag: 'BACKUPS',
      msg: 'Failed to migrate legacy device identifier',
      error: addIdentifierError,
      identifier,
    });
  }

  return { data, error };
}
