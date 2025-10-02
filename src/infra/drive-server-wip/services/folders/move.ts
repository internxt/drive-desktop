import { client, getWorkspaceHeader } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../out/error.types';
import { parseFolderDto } from '../../out/dto';

class MoveFolderError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'FOLDER_ALREADY_EXISTS',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

export async function move(context: { uuid: string; parentUuid: string; name: string; workspaceToken: string }) {
  const method = 'PATCH';
  const endpoint = '/folders/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.PATCH(endpoint, {
      headers: getWorkspaceHeader({ workspaceToken: context.workspaceToken }),
      body: { destinationFolder: context.parentUuid, name: context.name },
      params: { path: { uuid: context.uuid } },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Move folder request', context },
  });

  if (error) {
    switch (true) {
      case error.response?.status === 409:
        return { error: new MoveFolderError('FOLDER_ALREADY_EXISTS', error.cause) };
      default:
        return { error };
    }
  }

  return { data: parseFolderDto({ folderDto: data }) };
}
