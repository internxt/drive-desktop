import { client } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../out/error.types';
import { parseFolderDto } from '../../out/dto';

class CheckExistenceError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'PARENT_NOT_FOUND' | 'FOLDER_NOT_FOUND',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

export async function checkExistence(context: { parentUuid: string; name: string }) {
  const method = 'POST';
  const endpoint = '/folders/content/{uuid}/folders/existence';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      params: { path: { uuid: context.parentUuid } },
      body: { plainNames: [context.name] },
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Check file existence request', context },
  });

  if (res.error) {
    switch (true) {
      case res.error.response?.status === 404:
        return { error: new CheckExistenceError('PARENT_NOT_FOUND', res.error.cause) };
      default:
        return { error: res.error };
    }
  }

  const folderDto = res.data.existentFolders.pop();

  if (folderDto) {
    return { data: parseFolderDto({ folderDto }) };
  } else {
    return { error: new CheckExistenceError('FOLDER_NOT_FOUND', res.data) };
  }
}
