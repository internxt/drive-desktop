import { decryptDeviceName } from '@/backend/features/backups/device/in/decrypt-device-name';
import { createUniqueDevice } from './create-unique-device';
import { saveDeviceToConfig } from '@/backend/features/backups/device/in/save-device-to-config';

export async function createNewDevice() {
  const { data, error } = await createUniqueDevice();
  if (data) {
    saveDeviceToConfig(data);
    return { data: decryptDeviceName(data) };
  }
  return { error };
}
