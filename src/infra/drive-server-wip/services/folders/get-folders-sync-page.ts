import { paths } from '@internxt/drive-desktop-core/build/backend';
import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { CommonContext } from '@/apps/sync-engine/config';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';
import { ParsedFolderDto, parseFolderDto } from '../../out/dto';

export type GetFoldersSyncQuery = NonNullable<paths['/folders/sync']['get']['parameters']['query']>;

type Props = {
  ctx: CommonContext;
  context: { query: GetFoldersSyncQuery };
  skipLog?: boolean;
};

type SyncPage = {
  items: ParsedFolderDto[];
  nextCursor: string | null;
};

export async function getFoldersSyncPage({ ctx, context, skipLog }: Props): Promise<Result<SyncPage, Error>> {
  const method = 'GET';
  const endpoint = '/folders/sync';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    ctx.client.GET(endpoint, {
      signal: ctx.abortController.signal,
      params: { query: context.query },
    });

  const result = await clientWrapper({
    promiseFn,
    key,
    skipLog,
    loggerBody: { msg: 'Get folders sync request', context },
  });

  if (result.error) return Result.err(result.error);

  return Result.map(Result.ok(result.data), ({ folders, nextCursor }) => ({
    items: folders.map((folderDto) => parseFolderDto({ folderDto })),
    nextCursor,
  }));
}
