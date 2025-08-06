import { paths } from '@/apps/shared/HttpClient/schema';
import { clientWrapper } from '../in/client-wrapper.service';
import { client, getWorkspaceHeader } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../in/get-in-flight-request';
import { getByUuid } from './files/get-by-uuid';

export const files = {
  getFiles,
  getByUuid,
  createFile,
  moveFile,
  renameFile,
  replaceFile,
  createThumbnail,
};

type TGetFilesQuery = paths['/files']['get']['parameters']['query'];
type TCreateFileBody = paths['/files']['post']['requestBody']['content']['application/json'];
type TCreateThumnailBody = paths['/files/thumbnail']['post']['requestBody']['content']['application/json'];

async function getFiles(context: { query: TGetFilesQuery }) {
  const method = 'GET';
  const endpoint = '/files';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: { query: context.query },
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get files request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function createFile(context: { path: string; body: TCreateFileBody }) {
  const method = 'POST';
  const endpoint = '/files';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      body: context.body,
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Create file request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function moveFile(context: { uuid: string; parentUuid: string; workspaceToken: string }) {
  const method = 'PATCH';
  const endpoint = '/files/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.PATCH(endpoint, {
      headers: getWorkspaceHeader({ workspaceToken: context.workspaceToken }),
      body: { destinationFolder: context.parentUuid },
      params: { path: { uuid: context.uuid } },
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Move file request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function renameFile(context: { uuid: string; name: string; extension: string; workspaceToken: string }) {
  const method = 'PUT';
  const endpoint = '/files/{uuid}/meta';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.PUT(endpoint, {
      headers: getWorkspaceHeader({ workspaceToken: context.workspaceToken }),
      body: { plainName: context.name, type: context.extension },
      params: { path: { uuid: context.uuid } },
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Rename file request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function replaceFile(context: { uuid: string; newContentId: string; newSize: number; modificationTime?: Date }) {
  const method = 'PUT';
  const endpoint = '/files/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const body: { fileId: string; size: number; modificationTime?: Date } = {
    fileId: context.newContentId,
    size: context.newSize,
  };

  if (context.modificationTime) {
    body.modificationTime = context.modificationTime;
  }

  const promiseFn = () =>
    client.PUT(endpoint, {
      body,
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
