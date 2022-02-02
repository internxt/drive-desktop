import { aes } from '@internxt/lib';
import fetch from 'electron-fetch';
import os from 'os';

import { getHeaders } from '../auth/service';
import configStore from '../config';

export type Device = { name: string; id: number; bucket: string };

export async function getOrCreateDevice() {
  const savedDeviceId = configStore.get('deviceId');

  let device: Device | null = null;

  if (savedDeviceId !== -1) {
    const res = await fetch(
      `${
        process.env.API_URL
      }/api/backup/deviceAsFolder/${savedDeviceId.toString()}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );
    if (res.ok) device = await res.json();
  }

  if (!device) {
    try {
      device = await createDevice(os.hostname());
    } catch {
      device = await createDevice(
        `${os.hostname()} (${new Date().valueOf() % 1000})`
      );
    }
  }

  if (!device) throw new Error();

  configStore.set('deviceId', device.id);

  return decryptDeviceName(device);
}

async function createDevice(deviceName: string) {
  const res = await fetch(`${process.env.API_URL}/api/backup/deviceAsFolder`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ deviceName }),
  });
  if (res.ok) return res.json();
  else throw new Error();
}

function decryptDeviceName({ name, ...rest }: Device): Device {
  return {
    name: aes.decrypt(name, `${process.env.NEW_CRYPTO_KEY}-${rest.bucket}`),
    ...rest,
  };
}
