import { paths } from '@internxt/drive-desktop-core/build/backend';
import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { CommonContext } from '@/apps/sync-engine/config';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';
import { ParsedFileDto, parseFileDto } from '../../out/dto';

export type GetFilesSyncQuery = NonNullable<paths['/files/sync']['get']['parameters']['query']>;

type Props = {
  ctx: CommonContext;
  context: { query: GetFilesSyncQuery };
  skipLog?: boolean;
};

type SyncPage = {
  items: ParsedFileDto[];
  nextCursor: string | null;
};

export async function getFilesSyncPage({ ctx, context, skipLog }: Props): Promise<Result<SyncPage, Error>> {
  const method = 'GET';
  const endpoint = '/files/sync';
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
    loggerBody: { msg: 'Get files sync request', context },
  });

  if (result.error) return Result.err(result.error);

  return Result.map(Result.ok(result.data), ({ files, nextCursor }) => ({
    items: files.map((fileDto) => parseFileDto({ fileDto })),
    nextCursor,
  }));
}
