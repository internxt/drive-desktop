import { Device } from '../../../apps/main/device/service';
import os from 'os';
import { logger } from '../../../core/LoggerService/LoggerService';
import { tryCreateDevice } from './tryCreateDevice';
import { Either, left, right } from '../../../context/shared/domain/Either';
import { mapDeviceDtoToDevice } from './utils/deviceMapper';
import { addUnknownDeviceIssue } from './addUnknownDeviceIssue';
import { DeviceIdentifierDTO } from './device.types';
import { components } from 'src/infra/schemas';
/**
 * Creates a new device with a unique name
 * @returns Either containing the created device or an error if device creation fails after multiple attempts
 * @param attempts The number of attempts to create a device with a unique name, defaults to 1000
 */
export async function createUniqueDevice(
  deviceIdentifier: DeviceIdentifierDTO,
  attempts = 1000
): Promise<Either<Error, Device>> {
  const baseName = os.hostname();
  const nameVariants = [
    baseName,
    ...Array.from({ length: attempts }, (_, i) => `${baseName} (${i + 1})`),
  ];

  for (const name of nameVariants) {
    logger.info({
      tag: 'BACKUP',
      msg: `Trying to create device with name "${name}"`,
    });
    const tryCreateDeviceEither = await tryCreateDevice(name, deviceIdentifier);

    if (tryCreateDeviceEither.isRight()) {
      return right(tryCreateDeviceEither.getRight());
    }
    const error = tryCreateDeviceEither.getLeft();
    if (error.message == 'Error creating device') {
      return left(tryCreateDeviceEither.getLeft());
    }
  }
  const finalError = new Error(
    'Could not create device trying different names'
  );
  logger.error({
    tag: 'BACKUP',
    msg: finalError.message,
  });

  addUnknownDeviceIssue(finalError);
  return left(finalError);
}
