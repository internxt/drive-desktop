import { paths } from '@/apps/shared/HttpClient/schema';
import { clientWrapper } from '../in/client-wrapper.service';
import { noContentWrapper } from '../in/no-content-wrapper.service';
import { client } from '@/apps/shared/HttpClient/client';

type TGetFilesQuery = paths['/files']['get']['parameters']['query'];
type TCreateFileBody = paths['/files']['post']['requestBody']['content']['application/json'];
type TCreateThumnailBody = paths['/files/thumbnail']['post']['requestBody']['content']['application/json'];

export async function getFiles(context: { query: TGetFilesQuery }) {
  const promise = () =>
    client.GET('/files', {
      params: { query: context.query },
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get files request',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/files',
      },
    },
  });
}

export async function createFile(context: { body: TCreateFileBody }) {
  const promise = () =>
    client.POST('/files', {
      body: context.body,
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Create file request',
      context,
      attributes: {
        method: 'POST',
        endpoint: '/files',
      },
    },
  });
}

export async function moveFile(context: { uuid: string; parentUuid: string }) {
  const promise = () =>
    client.PATCH('/files/{uuid}', {
      body: { destinationFolder: context.parentUuid },
      params: { path: { uuid: context.uuid } },
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Move file request',
      context,
      attributes: {
        method: 'PATCH',
        endpoint: '/files/{uuid}',
      },
    },
  });
}

export async function renameFile(context: { uuid: string; name: string; type: string }) {
  const promise = () =>
    client.PUT('/files/{uuid}/meta', {
      body: { plainName: context.name, type: context.type },
      params: { path: { uuid: context.uuid } },
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Rename file request',
      context,
      attributes: {
        method: 'PUT',
        endpoint: '/files/{uuid}/meta',
      },
    },
  });
}

export async function replaceFile(context: { uuid: string; newContentId: string; newSize: number }) {
  const promise = () =>
    client.PUT('/files/{uuid}', {
      body: { fileId: context.newContentId, size: context.newSize },
      params: { path: { uuid: context.uuid } },
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Replace file request',
      context,
      attributes: {
        method: 'PUT',
        endpoint: '/files/{uuid}',
      },
    },
  });
}

export async function createThumbnail(context: { body: TCreateThumnailBody }) {
  const promise = () =>
    client.POST('/files/thumbnail', {
      body: context.body,
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Create thumbnail request',
      context,
      attributes: {
        method: 'POST',
        endpoint: '/files/thumbnail',
      },
    },
  });
}

export async function deleteContentFromBucket(context: { bucketId: string; contentId: string }) {
  const promise = () =>
    noContentWrapper({
      request: client.DELETE('/files/{bucketId}/{fileId}', {
        params: { path: { bucketId: context.bucketId, fileId: context.contentId } },
      }),
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Delete file content from bucket request',
      context,
      attributes: {
        method: 'DELETE',
        endpoint: '/files/{bucketId}/{fileId}',
      },
    },
  });
}
