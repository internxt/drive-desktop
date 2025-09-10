import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../out/error.types';
import { paths } from '@/apps/shared/HttpClient/schema';
import { getRequestKey } from '../../in/get-in-flight-request';

type TCreateFolderBody = paths['/folders']['post']['requestBody']['content']['application/json'];

class CreateFolderError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'ALREADY_EXISTS',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

export async function createFolder(context: { path: string; body: TCreateFolderBody }) {
  const method = 'POST';
  const endpoint = '/folders';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      body: context.body,
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Create folder request', context },
  });

  if (res.error?.code) {
    switch (true) {
      case res.error.response?.status === 409:
        return { error: new CreateFolderError('ALREADY_EXISTS', res.error.cause) };
    }
  }

  return res;
}
