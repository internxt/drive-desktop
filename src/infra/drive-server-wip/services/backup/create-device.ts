import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../out/error.types';

class CreateDeviceError extends DriveServerWipError {
  constructor(public readonly code: TDriveServerWipError | 'ALREADY_EXISTS') {
    super(code);
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
      case error.response?.status === 409:
        return { error: new CreateDeviceError('ALREADY_EXISTS') };
    }
  }

  return { data, error };
}
