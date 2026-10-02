import { paths } from '@internxt/drive-desktop-core/build/backend';
import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { SyncContext } from '@/apps/sync-engine/config';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';
import { ParsedFolderDto, parseFolderDto } from '../../out/dto';

export type GetWorkspaceFoldersSyncQuery = NonNullable<paths['/workspaces/{workspaceId}/folders/sync']['get']['parameters']['query']>;

type Props = {
  ctx: SyncContext;
  context: { query: GetWorkspaceFoldersSyncQuery };
  skipLog?: boolean;
};

type SyncPage = {
  items: ParsedFolderDto[];
  nextCursor: string | null;
};

export async function getFoldersSyncPage({ ctx, context, skipLog }: Props): Promise<Result<SyncPage, Error>> {
  const method = 'GET';
  const endpoint = '/workspaces/{workspaceId}/folders/sync';
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
    loggerBody: { msg: 'Get workspace folders sync request', context: requestContext },
  });

  if (result.error) return Result.err(result.error);

  return Result.map(Result.ok(result.data), ({ folders, nextCursor }) => ({
    items: folders.map((folderDto) => parseFolderDto({ folderDto })),
    nextCursor,
  }));
}
