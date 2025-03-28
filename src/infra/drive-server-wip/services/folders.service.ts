import { client } from '@/apps/shared/HttpClient/client';
import { paths } from '@/apps/shared/HttpClient/schema';
import { ClientWrapperService } from '../in/client-wrapper.service';

type TGetFoldersQuery = paths['/folders']['get']['parameters']['query'];
type TGetFoldersByFolderQuery = paths['/folders/content/{uuid}/folders']['get']['parameters']['query'];
type TGetFilesByFolderQuery = paths['/folders/content/{uuid}/files']['get']['parameters']['query'];

export class FoldersService {
  constructor(private readonly clientWrapper = new ClientWrapperService()) {}

  async getMetadata({ folderId }: { folderId: number }) {
    const promise = client.GET('/folders/{id}/metadata', {
      params: { path: { id: folderId } },
    });

    return this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Get folder metadata request was not successful',
        context: {
          folderId,
        },
        attributes: {
          method: 'GET',
          endpoint: '/folders/{id}/metadata',
        },
      },
    });
  }

  async getFolders({ query }: { query: TGetFoldersQuery }) {
    const promise = client.GET('/folders', { params: { query } });

    return this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Get folders request was not successful',
        context: {
          query,
        },
        attributes: {
          method: 'GET',
          endpoint: '/folders',
        },
      },
    });
  }

  async getFoldersByFolder({ folderUuid, query }: { folderUuid: string; query: TGetFoldersByFolderQuery }) {
    const promise = client.GET('/folders/content/{uuid}/folders', {
      params: { path: { uuid: folderUuid }, query },
    });

    const res = await this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Get folders by folder request was not successful',
        context: {
          folderUuid,
          query,
        },
        attributes: {
          method: 'GET',
          endpoint: '/folders/content/{uuid}/folders',
        },
      },
    });

    if (res.data) {
      return { data: res.data.folders };
    } else {
      return { error: res.error };
    }
  }

  async getFiles({ folderUuid, query }: { folderUuid: string; query: TGetFilesByFolderQuery }) {
    const promise = client.GET('/folders/content/{uuid}/files', {
      params: { path: { uuid: folderUuid }, query },
    });

    const res = await this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Get files by folder request was not successful',
        context: {
          folderUuid,
          query,
        },
        attributes: {
          method: 'GET',
          endpoint: '/folders/content/{uuid}/files',
        },
      },
    });

    if (res.data) {
      return { data: res.data.files };
    } else {
      return { error: res.error };
    }
  }
}
