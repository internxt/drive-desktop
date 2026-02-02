import { DependencyInjectionUserProvider } from './../../../apps/shared/dependency-injection/DependencyInjectionUserProvider';
import { createNewDevice } from './createNewDevice';
import { BrowserWindow } from 'electron';
import { broadcastToWindows } from '../../../apps/main/windows';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { getDeviceIdentifier } from './getDeviceIdentifier';

export async function createAndSetupNewDevice() {
  const { error, data: deviceIdentifier } = getDeviceIdentifier();
  if (error) return { error };

  const createNewDeviceEither = await createNewDevice(deviceIdentifier);
  if (createNewDeviceEither.isLeft()) {
    logger.error({
      tag: 'BACKUPS',
      msg: '[DEVICE] Error creating new device',
      error: createNewDeviceEither.getLeft(),
    });
    return { error: createNewDeviceEither.getLeft() };
  }

  const device = createNewDeviceEither.getRight();
  const user = DependencyInjectionUserProvider.get();
  user.backupsBucket = device.bucket;

  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (mainWindow) {
    mainWindow.webContents.send('reinitialize-backups');
  }
  broadcastToWindows('device-created', device);
  logger.debug({
    tag: 'BACKUPS',
    msg: '[DEVICE] Created new device',
    deviceUUID: device.uuid,
  });
  return { data: device };
}
