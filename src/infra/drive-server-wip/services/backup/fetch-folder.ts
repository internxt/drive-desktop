import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';
import { DriveServerWipError, TDriveServerWipError } from '../../out/error.types';

class FetchFolderError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'NOT_FOUND',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

export async function fetchFolder(context: { folderUuid: string }) {
  const method = 'GET';
  const endpoint = '/folders/content/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: { path: { uuid: context.folderUuid } },
    });

  const result = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Fetch folder contents',
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
        return { error: new FetchFolderError('NOT_FOUND', result.error.cause) };
    }
  }

  return result;
}
