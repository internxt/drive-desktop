import { paths } from '@internxt/drive-desktop-core/build/backend';
import { clientWrapper } from '../in/client-wrapper.service';
import { client } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../in/get-in-flight-request';

export const files = {
  createFile,
  moveFile,
  renameFile,
  replaceFile,
  createThumbnail,
};

type TCreateFileBody = paths['/files']['post']['requestBody']['content']['application/json'];
type TCreateThumnailBody = paths['/files/thumbnail']['post']['requestBody']['content']['application/json'];

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

async function moveFile(context: { uuid: string; parentUuid: string }) {
  const method = 'PATCH';
  const endpoint = '/files/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.PATCH(endpoint, {
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

async function renameFile(context: { uuid: string; name: string; type: string }) {
  const method = 'PUT';
  const endpoint = '/files/{uuid}/meta';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.PUT(endpoint, {
      body: { plainName: context.name, type: context.type },
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

async function replaceFile(context: { uuid: string; newContentId: string; newSize: number }) {
  const method = 'PUT';
  const endpoint = '/files/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.PUT(endpoint, {
      body: { fileId: context.newContentId, size: context.newSize },
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
