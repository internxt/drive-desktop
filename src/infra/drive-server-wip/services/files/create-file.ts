import { client } from '@/apps/shared/HttpClient/client';
import { paths } from '@/apps/shared/HttpClient/schema';
import { DriveServerWipError, TDriveServerWipError } from '../../out/error.types';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper, TResponse } from '../../in/client-wrapper.service';
import { FileDto, parseFileDto } from '../../out/dto';

type TCreateFileBody = paths['/files']['post']['requestBody']['content']['application/json'];

class CreateFileError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'FOLDER_NOT_FOUND' | 'FILE_ALREADY_EXISTS',
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

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Create file request', context },
  });

  return parseCreateFileResponse(res);
}

export function parseCreateFileResponse(res: Awaited<TResponse<FileDto>>) {
  if (res.error?.code === 'UNKNOWN') {
    switch (true) {
      case res.error.response?.status === 404:
        return { error: new CreateFileError('FOLDER_NOT_FOUND', res.error.cause) };
      case res.error.response?.status === 409:
        return { error: new CreateFileError('FILE_ALREADY_EXISTS', res.error.cause) };
    }
  }

  if (res.data) {
    return { data: parseFileDto({ fileDto: res.data }) };
  } else {
    return { error: res.error };
  }
}
