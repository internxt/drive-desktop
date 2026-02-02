import { logger } from '@internxt/drive-desktop-core/build/backend';
import { getMachineId } from '../../../infra/device/getMachineId';
import os from 'os';
import { DeviceIdentifierDTO, isAllowedPlatform } from './device.types';

export function getDeviceIdentifier() {
  const hostname = os.hostname().trim();
  const platform = os.platform();

  if (!isAllowedPlatform(platform)) {
    return { error: new Error(`Unsupported platform: ${platform}`) };
  }

  const { data: key, error } = getMachineId();

  if (key && platform && hostname) {
    const data: DeviceIdentifierDTO = { key, platform, hostname };
    return { data };
  }

  const err = logger.error({
    tag: 'BACKUPS',
    msg: 'No valid identifier available for device',
    error,
    context: { platform, hostname, key },
  });
  return { error: err };
}
