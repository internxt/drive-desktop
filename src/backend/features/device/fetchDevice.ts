import { Either, left, right } from '../../../context/shared/domain/Either';
import {
  decryptDeviceName,
  Device,
} from '../../../apps/main/device/service';
import { logger } from '../../../core/LoggerService/LoggerService';
import { BackupError } from '../../../infra/drive-server/services/backup/backup.error';
import { addUnknownDeviceIssue } from './addUnknownDeviceIssue';
type Props = {
  uuid: string;
  getDevice: (uuid: string) => Promise<Either<Error, Device | null>>;
} | {
  legacyId: string;
  getDevice: (legacyId: string) => Promise<Either<Error, Device | null>>;
}
/**
 * Checks if a device exists using the provided getDevice function
 * @param props - Union type object containing either:
 *   - { uuid: string, getDevice: (uuid: string) => Promise<Either<Error, Device | null>> } for UUID-based lookup
 *   - { legacyId: string, getDevice: (legacyId: string) => Promise<Either<Error, Device | null>> }
 *      for legacy ID-based lookup
 * @returns Either<Error, Device | null> - Right(Device) if found, Right(null) if not found, Left(Error) if error
 */
export async function fetchDevice(props: Props): Promise<Either<Error, Device | null>> {
  const getDeviceEither = 'uuid' in props
    ? await props.getDevice(props.uuid)
    : await props.getDevice(props.legacyId);

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
