import { getWorkspaceHeader } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../defs';
import { parseFileDto } from '../../out/dto';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { CommonContext } from '@/apps/sync-engine/config';

class MoveFileError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'FILE_ALREADY_EXISTS',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

type Props = {
  ctx: CommonContext;
  context: {
    uuid: FileUuid;
    parentUuid: FolderUuid;
    name: string;
    extension: string;
  };
};

export async function move({ ctx, context }: Props) {
  const method = 'PATCH';
  const endpoint = '/files/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    ctx.client.PATCH(endpoint, {
      signal: ctx.abortController.signal,
      headers: getWorkspaceHeader({ ctx }),
      body: { destinationFolder: context.parentUuid, name: context.name, type: context.extension },
      params: { path: { uuid: context.uuid } },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Move file request', context },
  });

  if (error) {
    if (error.response?.status === 409) {
      return { error: new MoveFileError('FILE_ALREADY_EXISTS', error.cause) };
    } else {
      return { error };
    }
  }

  return { data: parseFileDto({ fileDto: data }) };
}
