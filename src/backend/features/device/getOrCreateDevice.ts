import { Device } from '../backup/types/Device';
import configStore from '../../../apps/main/config';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { addUnknownDeviceIssue } from './addUnknownDeviceIssue';
import { fetchDeviceLegacyAndMigrate } from './fetchDeviceLegacyAndMigrate';
import { fetchDevice } from './fetchDevice';
import { createAndSetupNewDevice } from './createAndSetupNewDevice';
import { getDeviceIdentifier } from './getDeviceIdentifier';
import { Result } from './../../../context/shared/domain/Result';
import { DependencyInjectionUserProvider } from './../../../apps/shared/dependency-injection/DependencyInjectionUserProvider';

async function handleFetchDeviceResult(deviceResult: Result<Device, Error>) {
  if (deviceResult.error) {
    logger.debug({ tag: 'BACKUPS', msg: '[DEVICE] Device not found, creating a new one' });
    const { error, data } = await createAndSetupNewDevice();

    if (error) {
      addUnknownDeviceIssue(error);
      return { error };
    }

    return { data };
  }

  const user = DependencyInjectionUserProvider.get();
  user.backupsBucket = deviceResult.data.bucket;
  DependencyInjectionUserProvider.updateUser(user);

  return { data: deviceResult.data };
}

export async function getOrCreateDevice(): Promise<Result<Device, Error>> {
  try {
    const { error, data } = getDeviceIdentifier();
    if (error) return { error };

    const legacyId = configStore.get('deviceId');
    const savedUUID = configStore.get('deviceUUID');
    logger.debug({
      tag: 'BACKUPS',
      msg: '[DEVICE] Checking saved device identifiers',
      legacyId,
      savedUUID,
    });

    const hasLegacyId = legacyId !== -1;
    const hasUuid = savedUUID !== '';
    if (!hasLegacyId && !hasUuid) {
      const result = await fetchDevice({ deviceIdentifier: data });
      return await handleFetchDeviceResult(result);
    }

    /* eventually, this whole if section is going to be replaced
      when all the users naturaly migrated to the new identification mechanism */
    const prop = hasUuid ? { uuid: savedUUID } : { legacyId: legacyId.toString() };

    const deviceResult = await fetchDeviceLegacyAndMigrate(prop);
    return await handleFetchDeviceResult(deviceResult);
  } catch (error) {
    const unknownError = error instanceof Error ? error : new Error('Unexpected error in getOrCreateDevice');
    logger.error({
      tag: 'BACKUPS',
      msg: '[DEVICE] Unexpected error in getOrCreateDevice',
      error: unknownError,
    });
    addUnknownDeviceIssue(unknownError);
    return { error: unknownError };
  }
}
