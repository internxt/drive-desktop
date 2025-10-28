import { paths } from '@/apps/shared/HttpClient/schema';
import { clientWrapper } from '../in/client-wrapper.service';
import { client } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../in/get-in-flight-request';
import { getByUuid } from './files/get-by-uuid';
import { createFile } from './files/create-file';
import { getByPath } from './files/get-by-path';
import { checkExistence } from './files/check-existance';
import { parseFileDto } from '../out/dto';
import { move } from './files/move';

export const files = {
  getFiles,
  getByUuid,
  getByPath,
  createFile,
  move,
  replaceFile,
  createThumbnail,
  checkExistence,
};
export const FileModule = files;

type TGetFilesQuery = paths['/files']['get']['parameters']['query'];
type TCreateThumnailBody = paths['/files/thumbnail']['post']['requestBody']['content']['application/json'];

async function getFiles(context: { query: TGetFilesQuery }, extra?: { abortSignal: AbortSignal; skipLog?: boolean }) {
  const method = 'GET';
  const endpoint = '/files';
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
    loggerBody: { msg: 'Get files request', context },
  });

  if (data) {
    return { data: data.map((fileDto) => parseFileDto({ fileDto })) };
  } else {
    return { error };
  }
}

async function replaceFile(context: { uuid: string; newContentId: string; newSize: number; modificationTime: string }) {
  const method = 'PUT';
  const endpoint = '/files/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.PUT(endpoint, {
      body: {
        fileId: context.newContentId,
        size: context.newSize,
        modificationTime: context.modificationTime,
      },
      params: { path: { uuid: context.uuid } },
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Replace file request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function createThumbnail(context: { body: TCreateThumnailBody }) {
  const method = 'POST';
  const endpoint = '/files/thumbnail';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      body: context.body,
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Create thumbnail request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}
