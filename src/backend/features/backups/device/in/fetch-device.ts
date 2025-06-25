import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { logger } from '@/apps/shared/logger/logger';
import { decryptDeviceName } from '@/backend/features/backups/device/in/decrypt-device-name';
import { addUnknownDeviceIssue } from '@/backend/features/backups/device/in/add-unknown-device-issue';

/**
 * Checks if a device exists with the given UUID
 * @param deviceUuid The UUID of the device to check
 * @returns an object containing the device data if found, null if not found,
 *  or an object with an error if there was an issue fetching the device
 */
export async function fetchDevice({ deviceUuid }: { deviceUuid: string }) {
  const { data, error } = await driveServerWipModule.backup.getDevice({ deviceUuid });

  if (data) {
    const device = decryptDeviceName(data);
    logger.info({ tag: 'BACKUPS', msg: 'Found device', device: device.name });
    return { data: device };
  }

  if (error?.code === 'NOT_FOUND') {
    const msg = `Device not found for deviceUuid: ${deviceUuid}`;
    logger.info({ tag: 'BACKUPS', msg });
    addUnknownDeviceIssue(new Error(msg));
    return { data: null };
  } else {
    return { error: logger.error({ tag: 'BACKUPS', msg: 'Error fetching device', error }) };
  }
}
