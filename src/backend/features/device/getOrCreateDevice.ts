import { Device } from '../../../apps/main/device/service';
import configStore from '../../../apps/main/config';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { fetchDeviceLegacyAndMigrate } from './fetchDeviceLegacyAndMigrate';
import { fetchDevice } from './fetchDevice';
import { createAndSetupNewDevice } from './createAndSetupNewDevice';
import { getDeviceIdentifier } from './getDeviceIdentifier';
import { Result } from './../../../context/shared/domain/Result';

async function handleFetchDeviceResult(deviceResult: Result<Device, Error>) {
  if (deviceResult.error) {
    logger.debug({ tag: 'BACKUPS', msg: '[DEVICE] Device not found, creating a new one' });
    return await createAndSetupNewDevice();
  }

  return { data: deviceResult.data };
}

export async function getOrCreateDevice(): Promise<Result<Device, Error>> {
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
}
