import { Device } from '../../../apps/main/device/service';
import { driveServerModule } from '../../../infra/drive-server/drive-server.module';
import { decryptDeviceName } from '../../../apps/main/device/service';
import { getDeviceIdentifier } from './getDeviceIdentifier';

export async function renameDevice(deviceName: string): Promise<Device> {
  const deviceIdentifier = getDeviceIdentifier();
  if (deviceIdentifier.isLeft()) {
    throw new Error('Error in the request to rename a device');
  }
  
  const response = await driveServerModule.backup.updateDeviceByIdentifier(
    deviceIdentifier.getRight().key,
    deviceName
  );
  if (response.isRight()) {
    const device = response.getRight();
    return decryptDeviceName(device);
  } else {
    throw new Error('Error in the request to rename a device');
  }
}
