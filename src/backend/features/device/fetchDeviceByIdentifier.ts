import { left } from './../../../context/shared/domain/Either';
import { getDeviceIdentifier } from './getDeviceIdentifier';
import { fetchDevice } from './fetchDevice';
import { Either } from './../../../context/shared/domain/Either';
import { Device } from './../../../apps/main/device/service';

export async function fetchDeviceByIdentifier(): Promise<Either<Error, Device | null>> {
  const result = getDeviceIdentifier();
  if (result.isLeft()) {
    return left(result.getLeft());
  }
  return await fetchDevice({
    deviceIdentifier: result.getRight(),
  });
}
