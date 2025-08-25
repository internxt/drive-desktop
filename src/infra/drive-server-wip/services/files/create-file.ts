import { client } from '@/apps/shared/HttpClient/client';
import { paths } from '@/apps/shared/HttpClient/schema';
import { DriveServerWipError, TDriveServerWipError } from '../../out/error.types';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';

type TCreateFileBody = paths['/files']['post']['requestBody']['content']['application/json'];

class CreateFileError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'FOLDER_NOT_FOUND',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

export async function createFile(context: { path: string; body: TCreateFileBody }) {
  const method = 'POST';
  const endpoint = '/files';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      body: context.body,
    });

  const result = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Create file request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  if (result.error?.code === 'UNKNOWN') {
    switch (true) {
      case result.error.response?.status === 404:
        return { error: new CreateFileError('FOLDER_NOT_FOUND', result.error.cause) };
    }
  }
  return result;
}
