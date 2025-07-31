import { Either } from '../../../context/shared/domain/Either';
import { fetchDevice, FetchDeviceProps } from './fetchDevice';
import { migrateLegacyDeviceIdentifier } from './migrateLegacyDeviceIdentifier';
import { Device } from '../../../apps/main/device/service';
import configStore from '../../../apps/main/config';

export async function fetchDeviceLegacyAndMigrate(
  props: FetchDeviceProps
): Promise<Either<Error, Device | null>> {
  const deviceResult = await fetchDevice(props);

  if (deviceResult.isRight()) {
    const device = deviceResult.getRight();
    if (device) {
      return await migrateLegacyDeviceIdentifier(device);
    }
    configStore.set('deviceId', -1);
    configStore.set('deviceUUID', '');
  }
  return deviceResult;
}
