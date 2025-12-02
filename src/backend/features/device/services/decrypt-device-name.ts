import { Device } from '@/apps/main/device/service';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { aes } from '@internxt/lib';

export function decryptDeviceName(device: Device) {
  try {
    const key = `${process.env.NEW_CRYPTO_KEY}-${device.bucket}`;
    device.name = aes.decrypt(device.name, key);
  } catch {
    const key = `${process.env.NEW_CRYPTO_KEY}-${null}`;
    device.name = aes.decrypt(device.name, key);
  }

  logger.debug({ tag: 'BACKUPS', msg: 'Decrypted device', name: device.name });

  return device;
}
