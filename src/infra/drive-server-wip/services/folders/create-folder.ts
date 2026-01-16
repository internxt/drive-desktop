import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper, TResponse } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../defs';
import { paths } from '@/apps/shared/HttpClient/schema';
import { getRequestKey } from '../../in/get-in-flight-request';
import { FolderDto, parseFolderDto } from '../../out/dto';
import { CommonContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type CreateFolderBody = paths['/folders']['post']['requestBody']['content']['application/json'];

class CreateFolderError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'PARENT_NOT_FOUND' | 'FOLDER_ALREADY_EXISTS',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

type Props = {
  ctx: CommonContext;
  context: { path: AbsolutePath; body: CreateFolderBody };
};

export async function createFolder({ ctx, context }: Props) {
  const method = 'POST';
  const endpoint = '/folders';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      signal: ctx.abortController.signal,
      body: context.body,
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Create folder request', context },
  });

  return parseCreateFolderResponse(res);
}

export function parseCreateFolderResponse(res: Awaited<TResponse<FolderDto>>) {
  if (res.error) {
    switch (true) {
      case res.error.response?.status === 404:
        return { error: new CreateFolderError('PARENT_NOT_FOUND', res.error.cause) };
      case res.error.response?.status === 409:
        return { error: new CreateFolderError('FOLDER_ALREADY_EXISTS', res.error.cause) };
      default:
        return { error: res.error };
    }
  }

  return { data: parseFolderDto({ folderDto: res.data }) };
}
