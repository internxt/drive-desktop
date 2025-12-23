import { client } from '@/apps/shared/HttpClient/client';
import { paths } from '@/apps/shared/HttpClient/schema';
import { clientWrapper } from '../in/client-wrapper.service';
import { createFolder } from './folders/create-folder';
import { getRequestKey } from '../in/get-in-flight-request';
import { parseFolderDto } from '../out/dto';
import { move } from './folders/move';

export const folders = {
  createFolder,
  getFolders,
  move,
};
export const FolderModule = folders;

export type GetFoldersQuery = paths['/folders']['get']['parameters']['query'];

async function getFolders(context: { query: GetFoldersQuery }, extra?: { abortSignal: AbortSignal; skipLog?: boolean }) {
  const method = 'GET';
  const endpoint = '/folders';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      signal: extra?.abortSignal,
      params: { query: context.query },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    skipLog: extra?.skipLog,
    loggerBody: { msg: 'Get folders request', context },
  });

  if (data) {
    return { data: data.map((folderDto) => parseFolderDto({ folderDto })) };
  } else {
    return { error };
  }
}
