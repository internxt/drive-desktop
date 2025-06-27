import { addUnknownDeviceIssue } from './add-unknown-device-issue';
import { logger } from '@/apps/shared/logger/logger';
import os from 'os';
import { tryCreateDevice } from '@/backend/features/backups/device/in/try-create-device';

/**
 * Creates a new device with a unique name
 * @returns The an object with the created device or
 * an object with the error if device creation fails after multiple attempts
 * @param attempts The number of attempts to create a device with a unique name, defaults to 1000
 */
export async function createUniqueDevice(attempts = 1000) {
  const baseName = os.hostname();
  const nameVariants = [baseName, ...Array.from({ length: attempts }, (_, i) => `${baseName} (${i + 1})`)];

  for (const name of nameVariants) {
    logger.info({ tag: 'BACKUPS', msg: `Trying to create device with name "${name}"` });
    const { data, error } = await tryCreateDevice({ deviceName: name });

    if (data) return { data };
    if (error.message == 'Error creating device') return { error };
  }

  const finalError = logger.error({ tag: 'BACKUPS', msg: 'Could not create device trying different names' });
  addUnknownDeviceIssue(finalError);
  return { error: finalError };
}
