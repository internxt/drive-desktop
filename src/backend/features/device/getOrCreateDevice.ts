import { DependencyInjectionUserProvider } from './../../../apps/shared/dependency-injection/DependencyInjectionUserProvider';
import {
  Device,
} from '../../../apps/main/device/service';
import { driveServerModule } from './../../../infra/drive-server/drive-server.module';
import { Either } from './../../../context/shared/domain/Either';
import { BrowserWindow } from 'electron';
import { fetchDevice } from './fetchDevice';
import configStore from '../../../apps/main/config';
import { logger } from '../../../core/LoggerService/LoggerService';
import { broadcastToWindows } from '../../../apps/main/windows';
import { createNewDevice } from './createNewDevice';


async function fetchDeviceByLegacyIdAndMigrate(legacyId: string): Promise<Either<Error, Device | null>> {
  const deviceResult = await fetchDevice({
    legacyId: legacyId,
    getDevice: driveServerModule.backup.getDeviceById
  });

  if (deviceResult.isRight()) {
    const device = deviceResult.getRight();
    if (device) {
      configStore.set('deviceUUID', device.uuid);
      configStore.set('deviceId', -1);
      logger.info({
        msg: '[DEVICE] Migrated from legacy ID to UUID',
        legacyId: legacyId,
        uuid: device.uuid,
      });
    }
  }

  return deviceResult;
}

async function createAndSetupNewDevice(): Promise<Device | Error> {
  const createNewDeviceEither = await createNewDevice();
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

async function handleFetchDeviceResult(deviceResult: Either<Error, Device | null>) {
  if (deviceResult.isRight()) {
    const device = deviceResult.getRight();
    if (device) {
      return device;
    } else {
      logger.debug({ msg: '[DEVICE] Device not found, creating a new one' });
      return await createAndSetupNewDevice();
    }
  }

  if (deviceResult.isLeft()) {
    const error = deviceResult.getLeft();
    return error;
  }

  return new Error('Unknown error: Device not found or removed') ;
}

export async function getOrCreateDevice(): Promise<Device | Error> {
  const legacyId = configStore.get('deviceId'); // This is the legacy way of story the deviceId, we are now using the uuid
  const savedUUID = configStore.get('deviceUUID');
  logger.debug({
    msg: '[DEVICE] Saved device with legacy deviceId',
    savedDeviceId: legacyId,
  });
  logger.debug({
    msg: '[DEVICE] Saved device with UUID',
    savedDeviceId: savedUUID,
  });
  const hasLegacyId = legacyId !== -1;
  const hasUuid = savedUUID !== '';

  if (!hasLegacyId && !hasUuid) {
    logger.debug({ msg: '[DEVICE] No saved device, creating a new one' });
    return await createAndSetupNewDevice();
  }

  if (hasUuid) {
    const deviceResult = await fetchDevice({
      uuid: savedUUID,
      getDevice: driveServerModule.backup.getDevice
    });
    return handleFetchDeviceResult(deviceResult);
  }

  if (hasLegacyId) {
    /* eventually, this whole if section is going to be replaced
    when all the users naturaly migrated to the new uuid */
    const deviceResult = await fetchDeviceByLegacyIdAndMigrate(legacyId.toString());
    return handleFetchDeviceResult(deviceResult);
  }

  return new Error('Unknown error: Device not found or removed');
}
