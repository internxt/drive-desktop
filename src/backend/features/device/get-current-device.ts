import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { DeviceModule } from './device.module';

export async function getCurrentDevice() {
  const { deviceIdentifier, error } = DeviceModule.getDeviceIdentifier();

  if (error) {
    return { error };
  }
  return await driveServerWipModule.backup.getDeviceByIdentifier({ context: deviceIdentifier });
}
