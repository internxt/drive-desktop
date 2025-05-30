import { paths } from '@/apps/shared/HttpClient/schema';
import { clientWrapper } from '../in/client-wrapper.service';
import { noContentWrapper } from '../in/no-content-wrapper.service';
import { client } from '@/apps/shared/HttpClient/client';
import { retryWrapper } from '../out/retry-wrapper';

type TGetFilesQuery = paths['/files']['get']['parameters']['query'];
type TCreateFileBody = paths['/files']['post']['requestBody']['content']['application/json'];
type TCreateThumnailBody = paths['/files/thumbnail']['post']['requestBody']['content']['application/json'];

export class FilesService {
  getFiles(context: { query: TGetFilesQuery }) {
    const promise = client.GET('/files', {
      params: { query: context.query },
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Get files request was not successful',
        context,
        attributes: {
          method: 'GET',
          endpoint: '/files',
        },
      },
    });
  }

  createFile(context: { body: TCreateFileBody }) {
    const promise = client.POST('/files', {
      body: context.body,
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Create file request was not successful',
        context,
        attributes: {
          method: 'POST',
          endpoint: '/files',
        },
      },
    });
  }

  moveFile(context: { uuid: string; parentUuid: string }) {
    const promise = client.PATCH('/files/{uuid}', {
      body: { destinationFolder: context.parentUuid },
      params: { path: { uuid: context.uuid } },
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Move file request was not successful',
        context,
        attributes: {
          method: 'PATCH',
          endpoint: '/files/{uuid}',
        },
      },
    });
  }

  renameFile(context: { uuid: string; name: string; type: string }) {
    const promise = client.PUT('/files/{uuid}/meta', {
      body: { plainName: context.name, type: context.type },
      params: { path: { uuid: context.uuid } },
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Rename file request was not successful',
        context,
        attributes: {
          method: 'PUT',
          endpoint: '/files/{uuid}/meta',
        },
      },
    });
  }

  replaceFile(context: { uuid: string; newContentId: string; newSize: number }) {
    const promise = () => clientWrapper({
        promise: client.PUT('/files/{uuid}', {
          body: { fileId: context.newContentId, size: context.newSize },
          params: { path: { uuid: context.uuid } },
        }),
        loggerBody: {
          msg: 'Replace file request was not successful',
          context,
          attributes: {
            method: 'PUT',
            endpoint: '/files/{uuid}',
          },
        },
      });

    return retryWrapper({ promise });
  }

  createThumbnail(context: { body: TCreateThumnailBody }) {
    const promise = client.POST('/files/thumbnail', {
      body: context.body,
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Create thumbnail request was not successful',
        context,
        attributes: {
          method: 'POST',
          endpoint: '/files/thumbnail',
        },
      },
    });
  }

  deleteContentFromBucket(context: { bucketId: string; contentId: string }) {
    const promise = noContentWrapper({
      request: client.DELETE('/files/{bucketId}/{fileId}', {
        params: { path: { bucketId: context.bucketId, fileId: context.contentId } },
      }),
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Delete file content from bucket request was not successful',
        context,
        attributes: {
          method: 'DELETE',
          endpoint: '/files/{bucketId}/{fileId}',
        },
      },
    });
  }
}
