import { client } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { paths } from '@/apps/shared/HttpClient/schema';
import { parseCreateFileResponse } from '../files/create-file';

type CreateFileInWorkspaceBody = paths['/workspaces/{workspaceId}/files']['post']['requestBody']['content']['application/json'];

export async function createFile(context: { workspaceId: string; path: string; body: CreateFileInWorkspaceBody }) {
  const method = 'POST';
  const endpoint = '/workspaces/{workspaceId}/files';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      params: { path: { workspaceId: context.workspaceId } },
      body: context.body,
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Create file in workspace request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  return parseCreateFileResponse(res);
}
