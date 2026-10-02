import { paths } from '@internxt/drive-desktop-core/build/backend';
import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { SyncContext } from '@/apps/sync-engine/config';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';
import { ParsedFileDto, parseFileDto } from '../../out/dto';

export type GetWorkspaceFilesSyncQuery = NonNullable<paths['/workspaces/{workspaceId}/files/sync']['get']['parameters']['query']>;

type Props = {
  ctx: SyncContext;
  context: { query: GetWorkspaceFilesSyncQuery };
  skipLog?: boolean;
};

type SyncPage = {
  items: ParsedFileDto[];
  nextCursor: string | null;
};

export async function getFilesSyncPage({ ctx, context, skipLog }: Props): Promise<Result<SyncPage, Error>> {
  const method = 'GET';
  const endpoint = '/workspaces/{workspaceId}/files/sync';
  const requestContext = { path: { workspaceId: ctx.workspaceId }, query: context.query };
  const key = getRequestKey({ method, endpoint, context: requestContext });

  const promiseFn = () =>
    ctx.client.GET(endpoint, {
      signal: ctx.abortController.signal,
      params: requestContext,
    });

  const result = await clientWrapper({
    promiseFn,
    key,
    skipLog,
    loggerBody: { msg: 'Get workspace files sync request', context: requestContext },
  });

  if (result.error) return Result.err(result.error);

  return Result.map(Result.ok(result.data), ({ files, nextCursor }) => ({
    items: files.map((fileDto) => parseFileDto({ fileDto })),
    nextCursor,
  }));
}
