import { Either, right } from './../../../context/shared/domain/Either';
import { decryptDeviceName, Device } from '../../../apps/main/device/service';
import { createUniqueDevice } from './createUniqueDevice';
import { saveDeviceToConfig } from './saveDeviceToConfig';
import { DeviceIdentifierDTO } from './device.types';

export async function createNewDevice(
  deviceIdentifier: DeviceIdentifierDTO
): Promise<Either<Error, Device>> {
  const createUniqueDeviceEither = await createUniqueDevice(deviceIdentifier);
  if (createUniqueDeviceEither.isRight()) {
    const device = createUniqueDeviceEither.getRight();
    saveDeviceToConfig(device);
    return right(decryptDeviceName(device));
  }
  return createUniqueDeviceEither;
}
