import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../defs';
import { getRequestKey } from '../../in/get-in-flight-request';

export class CreateDeviceError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'ALREADY_EXISTS',
    cause?: unknown,
  ) {
    super(code, cause);
  }
}

export async function createDevice(context: { deviceName: string }) {
  const method = 'POST';
  const endpoint = '/backup/deviceAsFolder';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      body: { deviceName: context.deviceName },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Create device as folder request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  if (error) {
    if (error.response?.status === 409) {
      return { error: new CreateDeviceError('ALREADY_EXISTS', error.cause) };
    } else {
      return { error };
    }
  }

  return { data };
}
