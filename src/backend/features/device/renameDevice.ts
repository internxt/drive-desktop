import { Device } from '../backup/types/Device';
import { driveServerModule } from '../../../infra/drive-server/drive-server.module';
import { getDeviceIdentifier } from './getDeviceIdentifier';

export async function renameDevice(deviceName: string): Promise<Device> {
  const deviceIdentifier = getDeviceIdentifier();
  if (deviceIdentifier.error) {
    throw new Error('Error in the request to rename a device');
  }

  const response = await driveServerModule.backup.updateDeviceByIdentifier(deviceIdentifier.data.key, deviceName);
  if (response.isRight()) {
    return response.getRight();
  } else {
    throw new Error('Error in the request to rename a device');
  }
}
