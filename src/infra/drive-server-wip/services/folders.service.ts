import { paths } from '@/apps/shared/HttpClient/schema';
import { CommonContext } from '@/apps/sync-engine/config';
import { clientWrapper } from '../in/client-wrapper.service';
import { getRequestKey } from '../in/get-in-flight-request';
import { parseFolderDto } from '../out/dto';
import { checkExistence } from './folders/check-existence';
import { createFolder } from './folders/create-folder';
import { move } from './folders/move';

export const folders = {
  createFolder,
  getFolders,
  move,
  checkExistence,
};
export const FolderModule = folders;

export type GetFoldersQuery = paths['/folders']['get']['parameters']['query'];

async function getFolders({ ctx, context, skipLog }: { ctx: CommonContext; context: { query: GetFoldersQuery }; skipLog?: boolean }) {
  const method = 'GET';
  const endpoint = '/folders';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    ctx.client.GET(endpoint, {
      signal: ctx.abortController.signal,
      params: { query: context.query },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    skipLog,
    loggerBody: { msg: 'Get folders request', context },
  });

  if (data) {
    return { data: data.map((folderDto) => parseFolderDto({ folderDto })) };
  } else {
    return { error };
  }
}
