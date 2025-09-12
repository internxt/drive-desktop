import { Device } from '../../../apps/main/device/service';
import { Either } from './../../../context/shared/domain/Either';
import configStore from '../../../apps/main/config';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { fetchDeviceLegacyAndMigrate } from './fetchDeviceLegacyAndMigrate';
import { fetchDeviceByIdentifier } from './fetchDeviceByIdentifier';
import { createAndSetupNewDevice } from './createAndSetupNewDevice';
/**
 * Handles the result of a device fetch operation.
 *
 * - If the result is Right and contains a Device, returns the Device.
 * - If the result is Right and contains null, logs and creates a new device, then returns it.
 * - If the result is Left, returns the error.
 * - If the result is neither, returns a generic error.
 *
 * @param deviceResult - The Either<Error, Device | null> result from a device fetch operation.
 * @returns The Device if found or created, or an Error if an error occurred.
 */
async function handleFetchDeviceResult(
  deviceResult: Either<Error, Device | null>
) {
  if (deviceResult.isRight()) {
    const device = deviceResult.getRight();
    if (device) {
      return device;
    } else {
      logger.debug({ tag: 'BACKUPS', msg: '[DEVICE] Device not found, creating a new one' });
      return await createAndSetupNewDevice();
    }
  }

  if (deviceResult.isLeft()) {
    return deviceResult.getLeft();
  }

  return new Error('Unknown error: Device not found or removed');
}

export async function getOrCreateDevice(): Promise<Device | Error> {
  const legacyId = configStore.get('deviceId');
  const savedUUID = configStore.get('deviceUUID');
  logger.debug({
    tag: 'BACKUPS',
    msg: '[DEVICE] Saved device with legacy deviceId',
    savedDeviceId: legacyId,
  });
  logger.debug({
    tag: 'BACKUPS',
    msg: '[DEVICE] Saved device with UUID',
    savedDeviceId: savedUUID,
  });
  const hasLegacyId = legacyId !== -1;
  const hasUuid = savedUUID !== '';

  if (!hasLegacyId && !hasUuid) {
    const result = await fetchDeviceByIdentifier();
    return handleFetchDeviceResult(result);
  }

    /* eventually, this whole if section is going to be replaced
    when all the users naturaly migrated to the new identification mechanism */
    const prop = hasUuid
      ? { uuid: savedUUID }
      : { legacyId: legacyId.toString() };

    const deviceResult = await fetchDeviceLegacyAndMigrate(prop);
    return handleFetchDeviceResult(deviceResult);
}
