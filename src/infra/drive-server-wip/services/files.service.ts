import { paths } from '@/apps/shared/HttpClient/schema';
import { clientWrapper } from '../in/client-wrapper.service';
import { client } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../in/get-in-flight-request';
import { createFile } from './files/create-file';
import { parseFileDto } from '../out/dto';
import { move } from './files/move';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { ContentsId, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { CommonContext } from '@/apps/sync-engine/config';

export const files = {
  getFiles,
  createFile,
  move,
  replaceFile,
  createThumbnail,
};
export const FileModule = files;

export type GetFilesQuery = paths['/files']['get']['parameters']['query'];
type TCreateThumnailBody = paths['/files/thumbnail']['post']['requestBody']['content']['application/json'];

async function getFiles({ ctx, context, skipLog }: { ctx: CommonContext; context: { query: GetFilesQuery }; skipLog?: boolean }) {
  const method = 'GET';
  const endpoint = '/files';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      signal: ctx.abortController.signal,
      params: { query: context.query },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    skipLog,
    loggerBody: { msg: 'Get files request', context },
  });

  if (data) {
    return { data: data.map((fileDto) => parseFileDto({ fileDto })) };
  } else {
    return { error };
  }
}

async function replaceFile(context: {
  path: AbsolutePath;
  uuid: FileUuid;
  contentsId: ContentsId;
  size: number;
  modificationTime: string;
}) {
  const method = 'PUT';
  const endpoint = '/files/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.PUT(endpoint, {
      params: { path: { uuid: context.uuid } },
      body: {
        fileId: context.contentsId,
        size: context.size,
        modificationTime: context.modificationTime,
      },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Replace file request', context },
  });

  if (data) {
    return { data: parseFileDto({ fileDto: data }) };
  } else {
    return { error };
  }
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
    loggerBody: { msg: 'Create thumbnail request', context },
  });
}
