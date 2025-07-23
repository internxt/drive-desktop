import { DependencyInjectionUserProvider } from './../../../apps/shared/dependency-injection/DependencyInjectionUserProvider';
import { Device } from './../../../apps/main/device/service';
import { createNewDevice } from './createNewDevice';
import { BrowserWindow } from 'electron';
import { broadcastToWindows } from '../../../apps/main/windows';
import { logger } from '../../../core/LoggerService/LoggerService';
import { getDeviceIdentifier } from './getDeviceIdentifier';

export async function createAndSetupNewDevice(): Promise<Device | Error> {
  const getDeviceIdentifierResult = getDeviceIdentifier();
  if (getDeviceIdentifierResult.isLeft()) {
    return getDeviceIdentifierResult.getLeft();
  }
  const deviceIdentifier = getDeviceIdentifierResult.getRight();

  const createNewDeviceEither = await createNewDevice(deviceIdentifier);
  if (createNewDeviceEither.isRight()) {
    const device = createNewDeviceEither.getRight();
    const user = DependencyInjectionUserProvider.get();
    user.backupsBucket = device.bucket;

    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('reinitialize-backups');
    }
    broadcastToWindows('device-created', device);
    logger.info({
      msg: '[DEVICE] Created new device',
      deviceUUID: device.uuid,
    });
    return device;
  }
  return createNewDeviceEither.getLeft();
}
