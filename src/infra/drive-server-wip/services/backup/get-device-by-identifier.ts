import { client } from '@/apps/shared/HttpClient/client';
import { DeviceIdentifierDTO } from '@/backend/features/device/device.types';
import { getRequestKey } from '@/infra/drive-server-wip/in/get-in-flight-request';
import { GetDeviceError } from '@/infra/drive-server-wip/services/backup/device.errors';
import { clientWrapper } from '../../in/client-wrapper.service';

export async function getDeviceByIdentifier({ context }: { context: DeviceIdentifierDTO }) {
  const method = 'GET';
  const endpoint = '/backup/deviceAsFolder/identifier';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      query: {
        key: context.key,
        platform: context.platform,
        hostname: context.hostname,
      },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
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
        return { error: new GetDeviceError('NOT_FOUND', error.cause) };
    }
  }

  return { data, error };
}
