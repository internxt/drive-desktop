import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { paths } from '@/apps/shared/HttpClient/schema';
import { CommonContext } from '@/apps/sync-engine/config';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';
import { parseCreateFolderResponse } from '../folders/create-folder';

type Body = paths['/workspaces/{workspaceId}/folders']['post']['requestBody']['content']['application/json'];

type Props = {
  ctx: CommonContext;
  context: {
    path: AbsolutePath;
    body: Body;
  };
};

export async function createFolder({ ctx, context }: Props) {
  const method = 'POST';
  const endpoint = '/workspaces/{workspaceId}/folders';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    ctx.client.POST(endpoint, {
      signal: ctx.abortController.signal,
      params: { path: { workspaceId: ctx.workspaceId } },
      body: context.body,
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Create folder in workspace request', context },
  });

  return parseCreateFolderResponse(res);
}
