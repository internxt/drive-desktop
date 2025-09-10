import { client, getWorkspaceHeader } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { DriveServerWipError, TDriveServerWipError } from '../../out/error.types';
import { parseFolderDto } from '../../out/dto';

class RenameFolderError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'FOLDER_ALREADY_EXISTS',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

export async function renameFolder(context: { uuid: string; name: string; workspaceToken: string }) {
  const method = 'PUT';
  const endpoint = '/folders/{uuid}/meta';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.PUT(endpoint, {
      headers: getWorkspaceHeader({ workspaceToken: context.workspaceToken }),
      params: { path: { uuid: context.uuid } },
      body: { plainName: context.name },
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Rename folder request', context },
  });

  if (res.error) {
    switch (true) {
      case res.error.response?.status === 409:
        return { error: new RenameFolderError('FOLDER_ALREADY_EXISTS', res.error.cause) };
      default:
        return { error: res.error };
    }
  }

  return { data: parseFolderDto({ folderDto: res.data }) };
}
