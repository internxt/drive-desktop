import { driveServerModule } from './../../../infra/drive-server/drive-server.module';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { BackupError } from '../../../infra/drive-server/services/backup/backup.error';
import { addUnknownDeviceIssue } from './addUnknownDeviceIssue';
import { DeviceIdentifierDTO } from './device.types';

export type FetchDeviceProps = { deviceIdentifier: DeviceIdentifierDTO } | { uuid: string } | { legacyId: string };

async function getDeviceByProps(props: FetchDeviceProps) {
  if ('deviceIdentifier' in props) {
    const query = {
      key: props.deviceIdentifier.key,
      platform: props.deviceIdentifier.platform,
      hostname: props.deviceIdentifier.hostname,
      limit: 1,
      offset: 0,
    };
    const { error, data } = await driveServerModule.backup.getDevicesByIdentifier({ query });
    if (error) return { error };

    if (data.length === 0) {
      return { error: new BackupError('Device not found with given identifier', 'NOT_FOUND') };
    }

    return { data: data[0] };
  } else {
    const deviceResult =
      'uuid' in props
        ? await driveServerModule.backup.getDevice(props.uuid)
        : await driveServerModule.backup.getDeviceById(props.legacyId);

    if (deviceResult.isLeft()) return { error: deviceResult.getLeft() };

    return { data: deviceResult.getRight() };
  }
}

export async function fetchDevice(props: FetchDeviceProps) {
  const { error, data } = await getDeviceByProps(props);

  if (error) {
    if (error instanceof BackupError && error.code === 'NOT_FOUND') {
      const msg = 'Device not found';
      logger.debug({ tag: 'BACKUPS', msg: `[DEVICE] ${msg}` });
      addUnknownDeviceIssue(new Error(msg));
    }

    if (error instanceof BackupError && error.code === 'FORBIDDEN') {
      const msg = 'Device request returned forbidden';
      logger.debug({ tag: 'BACKUPS', msg: `[DEVICE] ${msg}` });
      addUnknownDeviceIssue(new Error(msg));
    }

    logger.error({ tag: 'BACKUPS', msg: '[DEVICE] Error fetching device', error: error.name });
    return { error };
  }

  return { data };
}
