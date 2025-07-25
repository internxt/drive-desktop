import { client } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { paths } from '@/apps/shared/HttpClient/schema';
import { clientWrapper } from '../../in/client-wrapper.service';

type TQuery = paths['/workspaces/{workspaceId}/folders/{folderUuid}/folders']['get']['parameters']['query'];

export async function getFoldersByFolder(
  context: { workspaceId: string; folderUuid: string; query: TQuery; workspaceToken: string },
  extra: { skipLog?: boolean; abortSignal: AbortSignal },
) {
  const method = 'GET';
  const endpoint = '/workspaces/{workspaceId}/folders/{folderUuid}/folders';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: {
        path: { workspaceId: context.workspaceId, folderUuid: context.folderUuid },
        query: context.query,
      },
      signal: extra.abortSignal,
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    skipLog: extra.skipLog,
    loggerBody: {
      msg: 'Get workspace folders by folder request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  if (data) {
    return { data: data.result };
  } else {
    return { error };
  }
}
