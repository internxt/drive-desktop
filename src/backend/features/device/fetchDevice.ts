import { driveServerModule } from './../../../infra/drive-server/drive-server.module';
import { Either, left, right } from '../../../context/shared/domain/Either';
import { decryptDeviceName, Device } from '../../../apps/main/device/service';
import { logger } from '../../../core/LoggerService/LoggerService';
import { BackupError } from '../../../infra/drive-server/services/backup/backup.error';
import { addUnknownDeviceIssue } from './addUnknownDeviceIssue';
import { DeviceIdentifierDTO } from './device.types';
import { mapDeviceDtoToDevice } from './utils/deviceMapper';
export type FetchDeviceProps =
  | { deviceIdentifier: DeviceIdentifierDTO }
  | { uuid: string }
  | { legacyId: string };

async function getDeviceByProps(
  props: FetchDeviceProps
): Promise<Either<Error, Device | null>> {
  if ('deviceIdentifier' in props) {
    const query = {
      key: props.deviceIdentifier.key,
      platform: props.deviceIdentifier.platform,
      hostname: props.deviceIdentifier.hostname,
      limit: 50,
      offset: 0,
    };
    const result = await driveServerModule.backup.getDevicesByIdentifier(query);

    if (result.isLeft()) return left(result.getLeft());

    const devices = result.getRight();
    if (devices.length === 0) return right(null);
    if (devices.length > 1)
      return left(new Error('Multiple devices found for the same identifier'));

    return right(devices[0]);
  } else {
    const deviceResult =
      'uuid' in props
        ? await driveServerModule.backup.getDevice(props.uuid)
        : await driveServerModule.backup.getDeviceById(props.legacyId);

    if (deviceResult.isLeft()) return left(deviceResult.getLeft());

    return right(mapDeviceDtoToDevice(deviceResult.getRight()));
  }
}

/**
 * Checks if a device exists using the provided identifier.
 * @param props - Union type object containing either:
 *   - { uuid: string } for UUID-based lookup
 *   - { legacyId: string } for legacy ID-based lookup
 *   - { deviceIdentifier: DeviceIdentifierDTO } for lookup by device identifier (key, platform, hostname)
 *
 * The function will automatically select the correct lookup method based on the provided property.
 *
 * @returns Either<Error, Device | null> - Right(Device) if found, Right(null) if not found, Left(Error) if error
 */
export async function fetchDevice(
  props: FetchDeviceProps
): Promise<Either<Error, Device | null>> {
  const getDeviceEither = await getDeviceByProps(props);

  if (getDeviceEither.isRight()) {
    const device = getDeviceEither.getRight();
    if (device && !device.removed) {
      const decryptedDevice = decryptDeviceName(device);
      logger.info({
        msg: '[DEVICE] Found device',
        device: decryptedDevice.name,
      });
      return right(decryptedDevice);
    }
  }

  if (getDeviceEither.isLeft()) {
    const error = getDeviceEither.getLeft();

    if (error instanceof BackupError && error.code === 'NOT_FOUND') {
      const msg = 'Device not found';
      logger.info({ msg: `[DEVICE] ${msg}` });
      addUnknownDeviceIssue(new Error(msg));
      return right(null);
    }

    logger.error({ msg: '[DEVICE] Error fetching device', error });
    return left(error);
  }

  return right(null);
}
