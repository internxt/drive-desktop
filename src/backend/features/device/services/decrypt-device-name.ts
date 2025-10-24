import { Device } from '@/apps/main/device/service';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { aes } from '@internxt/lib';

export function decryptDeviceName({ name, ...rest }: Device): Device {
  let nameDevice;
  let key;
  try {
    key = `${process.env.NEW_CRYPTO_KEY}-${rest.bucket}`;
    nameDevice = aes.decrypt(name, key);
  } catch {
    key = `${process.env.NEW_CRYPTO_KEY}-${null}`;
    nameDevice = aes.decrypt(name, key);
  }

  logger.debug({ tag: 'BACKUPS', msg: 'Decrypted device', nameDevice });

  return {
    name: nameDevice,
    ...rest,
  };
}
