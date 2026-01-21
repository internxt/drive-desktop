import { paths } from '@/apps/shared/HttpClient/schema';
import { DriveServerWipError, TDriveServerWipError } from '../../defs';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper, TResponse } from '../../in/client-wrapper.service';
import { FileDto, parseFileDto } from '../../out/dto';
import { CommonContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export type CreateFileBody = paths['/files']['post']['requestBody']['content']['application/json'];

class CreateFileError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'PARENT_NOT_FOUND' | 'FILE_ALREADY_EXISTS',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

type Props = {
  ctx: CommonContext;
  context: { path: AbsolutePath; body: CreateFileBody };
};

export async function createFile({ ctx, context }: Props) {
  const method = 'POST';
  const endpoint = '/files';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    ctx.client.POST(endpoint, {
      signal: ctx.abortController.signal,
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
  if (res.error) {
    switch (true) {
      case res.error.response?.status === 404:
        return { error: new CreateFileError('PARENT_NOT_FOUND', res.error.cause) };
      case res.error.response?.status === 409:
        return { error: new CreateFileError('FILE_ALREADY_EXISTS', res.error.cause) };
      default:
        return { error: res.error };
    }
  }

  return { data: parseFileDto({ fileDto: res.data }) };
}
