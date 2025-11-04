import { client } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DeviceError } from './device.errors';
import { ExistingDeviceIdentifierDTO } from '@/backend/features/device/device.types';

export async function addIdentifierToDevice(context: ExistingDeviceIdentifierDTO) {
  const method = 'POST';
  const endpoint = '/backup/v2/devices/migrate';
  const key = getRequestKey({ method, endpoint, context });
  const promiseFn = () =>
    client.POST(endpoint, {
      body: { ...context, platform: 'win32' },
    });
  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Add identifier to existing device request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  if (error?.code === 'UNKNOWN') {
    switch (true) {
      case error.response?.status === 404:
        return { error: new DeviceError('NOT_FOUND', error.cause) };
      case error.response?.status === 409:
        return { error: new DeviceError('ALREADY_HAS_IDENTIFIER', error.cause) };
    }
  }

  if (error) {
    return { error };
  }

  /**
   * v2.6.2 Alexis Mora
   * * Supposedly, all the DeviceDto will come with a folder property, but the response property is comming as optional
   * * So just in case, I did this check
   */
  if (!data?.folder) {
    return { error: new DeviceError('INVALID_DEVICE_DATA', 'The device data is missing the folder property') };
  }

  return { data: data.folder };
}
