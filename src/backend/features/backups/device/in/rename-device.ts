import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { decryptDeviceName } from '@/backend/features/backups/device/in/decrypt-device-name';
import { getDeviceUuid } from '@/backend/features/backups/device/in/get-device-uuid';

export async function renameDevice(deviceName: string) {
  const deviceUuid = getDeviceUuid();

  const res = await driveServerWipModule.backup.updateDevice({ deviceUuid, deviceName });

  if (res.data) {
    return decryptDeviceName(res.data);
  }

  throw new Error('Error in the request to rename a device');
}
