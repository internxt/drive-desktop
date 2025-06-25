import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { decryptDeviceName } from '@/backend/features/backups/device/in/decrypt-device-name';

export async function getDevices() {
  const { data } = await driveServerWipModule.backup.getDevices();
  const devices = data ?? [];
  return devices.filter(({ removed, hasBackups }) => !removed && hasBackups).map((device) => decryptDeviceName(device));
}
