import { AuthContext } from '@/apps/sync-engine/config';
import { DriveServerWipError, TDriveServerWipError } from '../../defs';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';

class FetchFolderError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'NOT_FOUND',
    cause: unknown,
  ) {
    super(code, cause);
  }
}

type Props = {
  ctx: AuthContext;
  context: { folderUuid: string };
};

export async function fetchFolder({ ctx, context }: Props) {
  const method = 'GET';
  const endpoint = '/folders/content/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    ctx.client.GET(endpoint, {
      params: { path: { uuid: context.folderUuid } },
    });

  const { error, data } = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Fetch folder contents',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  if (error) {
    if (error.response?.status === 404) {
      return { error: new FetchFolderError('NOT_FOUND', error.cause) };
    } else {
      return { error };
    }
  }

  return { data };
}
