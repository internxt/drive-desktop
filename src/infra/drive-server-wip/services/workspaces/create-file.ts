import { client, getWorkspaceHeader } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';
import { paths } from '@/apps/shared/HttpClient/schema';
import { parseCreateFileResponse } from '../files/create-file';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { CommonContext } from '@/apps/sync-engine/config';

type Body = paths['/workspaces/{workspaceId}/files']['post']['requestBody']['content']['application/json'];

type Props = {
  ctx: CommonContext;
  context: { path: AbsolutePath; body: Body };
};

export async function createFile({ ctx, context }: Props) {
  const method = 'POST';
  const endpoint = '/workspaces/{workspaceId}/files';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      signal: ctx.abortController.signal,
      headers: getWorkspaceHeader({ workspaceToken: ctx.workspaceToken }),
      params: { path: { workspaceId: ctx.workspaceId } },
      body: context.body,
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Create file in workspace request', context },
  });

  return parseCreateFileResponse(res);
}
