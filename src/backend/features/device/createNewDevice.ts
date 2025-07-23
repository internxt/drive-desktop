import { Either, right } from './../../../context/shared/domain/Either';
import { decryptDeviceName, Device } from '../../../apps/main/device/service';
import { createUniqueDevice } from './createUniqueDevice';
import { saveDeviceToConfig } from './saveDeviceToConfig';

export async function createNewDevice(): Promise<Either<Error, Device>> {
  const createUniqueDeviceEither = await createUniqueDevice();
  if (createUniqueDeviceEither.isRight()) {
    const device = createUniqueDeviceEither.getRight();
    saveDeviceToConfig(device);
    return right(decryptDeviceName(device));
  }
  return createUniqueDeviceEither;
}
