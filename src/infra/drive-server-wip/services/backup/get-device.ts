import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../out/error.types';

export class GetDeviceError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'NOT_FOUND',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

export async function getDevice(context: { deviceUuid: string }) {
  const promise = () =>
    client.GET('/backup/deviceAsFolder/{uuid}', {
      params: { path: { uuid: context.deviceUuid } },
    });

  const { data, error } = await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get device as folder request',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/backup/deviceAsFolder/{uuid}',
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
