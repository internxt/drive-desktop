import { client } from '@/apps/shared/HttpClient/client';
import { paths } from '@/apps/shared/HttpClient/schema';
import { clientWrapper } from '../in/client-wrapper.service';
import { createFolder } from './folders/create-folder';
import { getRequestKey } from '../in/get-in-flight-request';
import { parseFileDto, parseFolderDto } from '../out/dto';
import { getByUuid } from './folders/get-by-uuid';
import { checkExistence } from './folders/check-existence';
import { move } from './folders/move';

export const folders = {
  getByUuid,
  createFolder,
  getMetadata,
  getFolders,
  getFoldersByFolder,
  getFilesByFolder,
  move,
  checkExistence,
};

type TGetFoldersQuery = paths['/folders']['get']['parameters']['query'];
type TGetFoldersByFolderQuery = paths['/folders/content/{uuid}/folders']['get']['parameters']['query'];
type TGetFilesByFolderQuery = paths['/folders/content/{uuid}/files']['get']['parameters']['query'];

async function getMetadata(context: { folderId: number }) {
  const method = 'GET';
  const endpoint = '/folders/{id}/metadata';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: { path: { id: context.folderId } },
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get folder metadata request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function getFolders(context: { query: TGetFoldersQuery }) {
  const method = 'GET';
  const endpoint = '/folders';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () => client.GET(endpoint, { params: { query: context.query } });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get folders request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function getFoldersByFolder(
  context: { folderUuid: string; query: TGetFoldersByFolderQuery },
  extra?: { abortSignal: AbortSignal; skipLog?: boolean },
) {
  const method = 'GET';
  const endpoint = '/folders/content/{uuid}/folders';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: { path: { uuid: context.folderUuid }, query: context.query },
      signal: extra?.abortSignal,
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    skipLog: extra?.skipLog,
    loggerBody: {
      msg: 'Get folders by folder request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  if (res.data) {
    return { data: res.data.folders.map((folderDto) => parseFolderDto({ folderDto })) };
  } else {
    return { error: res.error };
  }
}

async function getFilesByFolder(
  context: { folderUuid: string; query: TGetFilesByFolderQuery },
  extra: { abortSignal: AbortSignal; skipLog?: boolean },
) {
  const method = 'GET';
  const endpoint = '/folders/content/{uuid}/files';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: { path: { uuid: context.folderUuid }, query: context.query },
      signal: extra.abortSignal,
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    skipLog: extra.skipLog,
    loggerBody: {
      msg: 'Get files by folder request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  if (res.data) {
    return { data: res.data.files.map((fileDto) => parseFileDto({ fileDto })) };
  } else {
    return { error: res.error };
  }
}
