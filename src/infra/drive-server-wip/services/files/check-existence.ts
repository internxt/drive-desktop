import { client, getWorkspaceHeader } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { parseFileDto } from '../../out/dto';
import { DriveServerWipError, TDriveServerWipError } from '../../defs';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { CommonContext } from '@/apps/sync-engine/config';

class CheckExistenceError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'PARENT_NOT_FOUND' | 'FILE_NOT_FOUND',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

type Props = {
  ctx: CommonContext;
  context: {
    parentUuid: FolderUuid;
    name: string;
    extension: string;
  };
};

export async function checkExistence({ ctx, context }: Props) {
  const method = 'POST';
  const endpoint = '/folders/content/{uuid}/files/existence';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      signal: ctx.abortController.signal,
      headers: getWorkspaceHeader({ ctx }),
      params: { path: { uuid: context.parentUuid } },
      body: { files: [{ plainName: context.name, type: context.extension }] },
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Check file existence request', context },
  });

  if (res.error) {
    if (res.error.response?.status === 404) {
      return { error: new CheckExistenceError('PARENT_NOT_FOUND', res.error.cause) };
    } else {
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
