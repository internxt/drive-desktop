import { getRequestKey } from '@/infra/drive-server-wip/in/get-in-flight-request';
import { clientWrapper } from '@/infra/drive-server-wip/in/client-wrapper.service';
import { GetDeviceError } from '@/infra/drive-server-wip/services/backup/device.errors';
import { ExistingDeviceIdentifierDTO } from '@/backend/features/device/device.types';
import { client } from '@/apps/shared/HttpClient/client';

export async function addIdentifierToExistingDevice(context: ExistingDeviceIdentifierDTO) {
  const method = 'PATCH';
  const endpoint = '/backup/devices/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.PATCH(endpoint.replace('{uuid}', context.uuid), {
      body: {
        key: context.key,
        platform: context.platform,
        hostname: context.hostname,
      },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Add device identifier request',
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
      case error.response?.status === 409:
        return { error: new GetDeviceError('ALREADY_EXISTS', error.cause) };
    }
  }

  return { data, error };
}
