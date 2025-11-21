import { client } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DeviceError } from './device.errors';
type Props = {
  key: string;
};

export async function getDeviceByIdentifier(context: Props) {
  const method = 'GET';
  const endpoint = '/backup/v2/devices';
  const requestKey = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: { query: { key: context.key, limit: 50, offset: 0, platform: 'win32' } },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key: requestKey,
    loggerBody: {
      msg: 'Get device by identifier request',
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
    }
  }

  if (!data || data.length === 0) {
    return { error: new DeviceError('NOT_FOUND', 'No devices found for the given identifier') };
  }

  if (data.length > 1) {
    return { error: new DeviceError('MULTIPLE_DEVICES_FOUND', 'Multiple devices found for the given identifier') };
  }

  /**
   * v2.6.2 Alexis Mora
   * * Supposedly, all the DeviceDto will come with a folder property, but the response property is comming as optional
   * * So just in case, I did this check
   */
  if (!data[0].folder) {
    return { error: new DeviceError('INVALID_DEVICE_DATA', 'The device data is missing the folder property') };
  }

  return {
    data: {
      device: data[0].folder,
      key: data[0].key,
      hostname: data[0].hostname,
    },
    error,
  };
}
