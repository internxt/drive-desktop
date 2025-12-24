import { client, getWorkspaceHeader } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../out/error.types';
import { parseFolderDto } from '../../out/dto';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { CommonContext } from '@/apps/sync-engine/config';

class MoveFolderError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'FOLDER_ALREADY_EXISTS',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

type Props = {
  ctx: CommonContext;
  context: {
    uuid: FolderUuid;
    parentUuid: FolderUuid;
    name: string;
  };
};

export async function move({ ctx, context }: Props) {
  const method = 'PATCH';
  const endpoint = '/folders/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.PATCH(endpoint, {
      signal: ctx.abortController.signal,
      headers: getWorkspaceHeader({ ctx }),
      body: { destinationFolder: context.parentUuid, name: context.name },
      params: { path: { uuid: context.uuid } },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Move folder request', context },
  });

  if (error) {
    if (error.response?.status === 409) {
      return { error: new MoveFolderError('FOLDER_ALREADY_EXISTS', error.cause) };
    } else {
      return { error };
    }
  }

  return { data: parseFolderDto({ folderDto: data }) };
}
