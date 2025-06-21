import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../out/error.types';
import { paths } from '@/apps/shared/HttpClient/schema';

type TCreateFolderBody = paths['/folders']['post']['requestBody']['content']['application/json'];

class CreateFolderError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'ALREADY_EXISTS',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

export async function createFolder(context: { body: TCreateFolderBody }) {
  const promise = client.POST('/folders', {
    body: context.body,
  });

  const { data, error } = await clientWrapper({
    promise: () => promise,
    loggerBody: {
      msg: 'Create folder request was not successful',
      context,
      attributes: {
        method: 'POST',
        endpoint: '/folders',
      },
    },
  });

  if (error?.code === 'UNKNOWN') {
    switch (true) {
      case error.response?.status === 409:
        return { error: new CreateFolderError('ALREADY_EXISTS', error.cause) };
    }
  }

  return { data, error };
}
