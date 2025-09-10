import { client } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../out/error.types';
import { parseFileDto } from '../../out/dto';

class CheckExistenceError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'PARENT_NOT_FOUND' | 'FILE_NOT_FOUND',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

export async function checkExistence(context: { parentUuid: string; name: string; extension: string }) {
  const method = 'POST';
  const endpoint = '/folders/content/{uuid}/files/existence';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      params: { path: { uuid: context.parentUuid } },
      body: { files: [{ plainName: context.name, type: context.extension }] },
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

  const fileDto = res.data.existentFiles.pop();

  if (fileDto) {
    return { data: parseFileDto({ fileDto }) };
  } else {
    return { error: new CheckExistenceError('FILE_NOT_FOUND', res.data) };
  }
}
