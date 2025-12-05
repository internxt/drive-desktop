import { client, getWorkspaceHeader } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { paths } from '@/apps/shared/HttpClient/schema';
import { parseCreateFileResponse } from '../files/create-file';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type Body = paths['/workspaces/{workspaceId}/files']['post']['requestBody']['content']['application/json'];

export async function createFile(context: { path: AbsolutePath; body: Body; workspaceId: string; workspaceToken: string }) {
  const method = 'POST';
  const endpoint = '/workspaces/{workspaceId}/files';
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
    loggerBody: { msg: 'Create file in workspace request', context },
  });

  return parseCreateFileResponse(res);
}
