import { client, getWorkspaceHeader } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { paths } from '@/apps/shared/HttpClient/schema';
import { parseCreateFolderResponse } from '../folders/create-folder';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type Body = paths['/workspaces/{workspaceId}/folders']['post']['requestBody']['content']['application/json'];

export async function createFolder(context: { path: AbsolutePath; workspaceId: string; body: Body; workspaceToken: string }) {
  const method = 'POST';
  const endpoint = '/workspaces/{workspaceId}/folders';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      params: { path: { workspaceId: context.workspaceId } },
      body: context.body,
      headers: getWorkspaceHeader({ workspaceToken: context.workspaceToken }),
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Create folder in workspace request', context },
  });

  return parseCreateFolderResponse(res);
}
