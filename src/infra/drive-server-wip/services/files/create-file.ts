import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { paths } from '@/apps/shared/HttpClient/schema';
import { CommonContext } from '@/apps/sync-engine/config';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';
import { parseCreateFileResponse } from './parse-create-file-response';

export type CreateFileBody = paths['/files']['post']['requestBody']['content']['application/json'];

type Props = {
  ctx: CommonContext;
  context: { path: AbsolutePath; body: CreateFileBody };
};

export async function createFile({ ctx, context }: Props) {
  const method = 'POST';
  const endpoint = '/files';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    ctx.client.POST(endpoint, {
      signal: ctx.abortController.signal,
      body: context.body,
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Create file request', context },
  });

  return parseCreateFileResponse(res);
}
