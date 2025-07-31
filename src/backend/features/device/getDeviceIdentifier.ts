import { Either, left, right } from './../../../context/shared/domain/Either';
import { logger } from '../../../core/LoggerService/LoggerService';
import { getMachineId } from '../../../infra/device/getMachineId';
import os from 'os';
import { DeviceIdentifierDTO, isAllowedPlatform } from './device.types';


export function getDeviceIdentifier(): Either<Error, DeviceIdentifierDTO> {
  const hostname = os.hostname().trim();
  const platform = os.platform();

  if (!isAllowedPlatform(platform)) {
    return left(new Error(`Unsupported platform: ${platform}`));
  }

  const { data: key, error } = getMachineId();

  if (key && platform && hostname) {
    return right({ key, platform, hostname });
  }

  const err = new Error('No valid identifier available for device');
  logger.error({
    tag: 'BACKUP',
    msg: err.message,
    exc: error,
    context: { platform, hostname, key },
  });
  return left(err);
}
