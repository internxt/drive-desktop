import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../out/error.types';
import { isErrorWithStatusCode } from '../../in/helpers/error-helpers';

class CreateDeviceError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'ALREADY_EXISTS',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

export async function createDevice(context: { deviceName: string }) {
  const { data, error } = await clientWrapper({
    promise: client.POST('/backup/deviceAsFolder', {
      body: { deviceName: context.deviceName },
    }),
    loggerBody: {
      msg: 'Create device as folder request was not successful',
      context,
      attributes: {
        method: 'POST',
        endpoint: '/backup/deviceAsFolder',
      },
    },
  });

  if (error?.code === 'UNKNOWN') {
    switch (true) {
      case isErrorWithStatusCode({ error, code: 409 }):
        return { error: new CreateDeviceError('ALREADY_EXISTS', error) };
      default:
        return { error: new CreateDeviceError('UNKNOWN', error) };
    }
  }

  return { data };
}
