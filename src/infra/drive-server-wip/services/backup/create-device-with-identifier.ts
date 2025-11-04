import { components } from '@/apps/shared/HttpClient/schema';
import { getRequestKey } from '../../in/get-in-flight-request';
import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DeviceError } from './device.errors';

type Props = Omit<components['schemas']['CreateDeviceAndFolderDto'], 'platform'>;

export async function createDeviceWithIdentifier(context: Props) {
  const method = 'POST';
  const endpoint = '/backup/v2/devices';
  const key = getRequestKey({ method, endpoint, context });
  const promiseFn = () =>
    client.POST(endpoint, {
      body: { ...context, platform: 'win32' },
    });
  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Create device with identifier request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  if (error?.code === 'UNKNOWN') {
    switch (true) {
      case error.response?.status === 409:
        return { error: new DeviceError('ALREADY_EXISTS', error.cause) };
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
