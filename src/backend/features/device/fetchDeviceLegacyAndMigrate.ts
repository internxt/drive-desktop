import { Either } from 'src/context/shared/domain/Either';
import { fetchDevice, FetchDeviceProps } from './fetchDevice';
import { migrateLegacyDeviceIdentifier } from './migrateLegacyDeviceIdentifier';
import { Device } from 'src/apps/main/device/service';

export async function fetchDeviceLegacyAndMigrate(
  props: FetchDeviceProps
): Promise<Either<Error, Device | null>> {
  const deviceResult = await fetchDevice(props);

  if (deviceResult.isRight()) {
    const device = deviceResult.getRight();
    if (device) {
      return await migrateLegacyDeviceIdentifier(device);
    }
  }
  return deviceResult;
}
