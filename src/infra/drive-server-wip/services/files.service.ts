import { paths } from '@/apps/shared/HttpClient/schema';
import { ClientWrapperService } from '../in/client-wrapper.service';
import { noContentWrapper } from '../in/no-content-wrapper.service';
import { client } from '@/apps/shared/HttpClient/client';

type TGetFilesQuery = paths['/files']['get']['parameters']['query'];
type TCreateThumnailBody = paths['/files/thumbnail']['post']['requestBody']['content']['application/json'];

export class FilesService {
  constructor(private readonly clientWrapper = new ClientWrapperService()) {}

  async getFiles(context: { query: TGetFilesQuery }) {
    const promise = client.GET('/files', {
      params: { query: context.query },
    });

    return this.clientWrapper.run({
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

  async moveFile(context: { uuid: string; parentUuid: string }) {
    const promise = client.PATCH('/files/{uuid}', {
      body: { destinationFolder: context.parentUuid },
      params: { path: { uuid: context.uuid } },
    });

    return this.clientWrapper.run({
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

  async renameFile(context: { uuid: string; name: string; type: string }) {
    const promise = client.PUT('/files/{uuid}/meta', {
      body: { plainName: context.name, type: context.type },
      params: { path: { uuid: context.uuid } },
    });

    return this.clientWrapper.run({
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

  async replaceFile(context: { uuid: string; newContentId: string; newSize: number }) {
    const promise = client.PUT('/files/{uuid}', {
      body: { fileId: context.newContentId, size: context.newSize },
      params: { path: { uuid: context.uuid } },
    });

    return this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Replace file request was not successful',
        context,
        attributes: {
          method: 'PUT',
          endpoint: '/files/{uuid}',
        },
      },
    });
  }

  async createThumbnail(context: { body: TCreateThumnailBody }) {
    const promise = client.POST('/files/thumbnail', {
      body: context.body,
    });

    return this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Get files request was not successful',
        context,
        attributes: {
          method: 'POST',
          endpoint: '/files/thumbnail',
        },
      },
    });
  }

  async deleteContentFromBucket(context: { bucketId: string; contentId: string }) {
    const promise = noContentWrapper({
      request: client.DELETE('/files/{bucketId}/{fileId}', {
        params: { path: { bucketId: context.bucketId, fileId: context.contentId } },
      }),
    });

    return this.clientWrapper.run({
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
