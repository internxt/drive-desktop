import { client, getWorkspaceHeader } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { paths } from '@/apps/shared/HttpClient/schema';
import { clientWrapper } from '../../in/client-wrapper.service';
import { parseFileDto } from '../../out/dto';

type TQuery = paths['/workspaces/{workspaceId}/folders/{folderUuid}/files']['get']['parameters']['query'];

export async function getFilesByFolder(
  context: { workspaceId: string; folderUuid: string; query: TQuery; workspaceToken: string },
  extra: { skipLog?: boolean; abortSignal: AbortSignal },
) {
  const method = 'GET';
  const endpoint = '/workspaces/{workspaceId}/folders/{folderUuid}/files';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      headers: getWorkspaceHeader({ workspaceToken: context.workspaceToken }),
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
      msg: 'Get workspace files by folder request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  if (data) {
    return { data: data.result.map((fileDto) => parseFileDto({ fileDto })) };
  } else {
    return { error };
  }
}
