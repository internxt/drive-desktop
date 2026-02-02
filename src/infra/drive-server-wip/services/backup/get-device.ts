import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../defs';
import { getRequestKey } from '../../in/get-in-flight-request';

export class GetDeviceError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'NOT_FOUND',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

export async function getDevice(context: { deviceUuid: string }) {
  const method = 'GET';
  const endpoint = '/backup/deviceAsFolder/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: { path: { uuid: context.deviceUuid } },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get device as folder request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  if (error) {
    if (error.response?.status === 404) {
      return { error: new GetDeviceError('NOT_FOUND', error.cause) };
    } else {
      return { error };
    }
  }

  return { data };
}
