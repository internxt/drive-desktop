import { aes } from '@internxt/lib';
import { logger } from '@/apps/shared/logger/logger';
import { Device } from '@/apps/main/device/service';

export function decryptDeviceName({ name, ...rest }: Device): Device {
  let nameDevice;
  let key;
  try {
    key = `${process.env.NEW_CRYPTO_KEY}-${rest.bucket}`;
    nameDevice = aes.decrypt(name, key);
  } catch (error) {
    key = `${process.env.NEW_CRYPTO_KEY}-${null}`;
    nameDevice = aes.decrypt(name, key);
  }

  logger.debug({ tag: 'BACKUPS', msg: 'Decrypted device', nameDevice });

  return {
    name: nameDevice,
    ...rest,
  };
}
