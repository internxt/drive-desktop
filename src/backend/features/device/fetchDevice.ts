import { driveServerModule } from './../../../infra/drive-server/drive-server.module';
import { Either, left, right } from '../../../context/shared/domain/Either';
import { Device } from '../../../apps/main/device/service';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { BackupError } from '../../../infra/drive-server/services/backup/backup.error';
import { addUnknownDeviceIssue } from './addUnknownDeviceIssue';
import { DeviceIdentifierDTO } from './device.types';
export type FetchDeviceProps = { deviceIdentifier: DeviceIdentifierDTO } | { uuid: string } | { legacyId: string };

async function getDeviceByProps(props: FetchDeviceProps): Promise<Either<Error, Device | null>> {
  if ('deviceIdentifier' in props) {
    const query = {
      key: props.deviceIdentifier.key,
      platform: props.deviceIdentifier.platform,
      hostname: props.deviceIdentifier.hostname,
    };
    const result = await driveServerModule.backup.getDevicesByIdentifier(query);

    if (result.isLeft()) return left(result.getLeft());

    const devices = result.getRight();
    if (devices.length === 0) return right(null);
    if (devices.length > 1) return left(new Error('Multiple devices found for the same identifier'));

    return right(devices[0]);
  } else {
    const deviceResult =
      'uuid' in props
        ? await driveServerModule.backup.getDevice(props.uuid)
        : await driveServerModule.backup.getDeviceById(props.legacyId);

    if (deviceResult.isLeft()) return left(deviceResult.getLeft());

    return right(deviceResult.getRight());
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
export async function fetchDevice(props: FetchDeviceProps): Promise<Either<Error, Device | null>> {
  const getDeviceEither = await getDeviceByProps(props);

  if (getDeviceEither.isRight()) {
    const device = getDeviceEither.getRight();
    if (device && !device.removed) {
      logger.debug({
        tag: 'BACKUPS',
        msg: '[DEVICE] Found device',
        device: device.name,
      });
      return right(device);
    }
  }

  if (getDeviceEither.isLeft()) {
    const error = getDeviceEither.getLeft();

    if (error instanceof BackupError && error.code === 'NOT_FOUND') {
      const msg = 'Device not found';
      logger.debug({ tag: 'BACKUPS', msg: `[DEVICE] ${msg}` });
      addUnknownDeviceIssue(new Error(msg));
      return right(null);
    }

    if (error instanceof BackupError && error.code === 'FORBIDDEN') {
      const msg = 'Device request returned forbidden';
      logger.debug({ tag: 'BACKUPS', msg: `[DEVICE] ${msg}` });
      addUnknownDeviceIssue(new Error(msg));
      return right(null);
    }

    logger.error({ tag: 'BACKUPS', msg: '[DEVICE] Error fetching device', error: error.name });
    return left(error);
  }

  return right(null);
}
