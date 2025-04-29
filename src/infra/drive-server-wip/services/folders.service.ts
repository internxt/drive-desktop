import { client } from '@/apps/shared/HttpClient/client';
import { paths } from '@/apps/shared/HttpClient/schema';
import { clientWrapper } from '../in/client-wrapper.service';

type TGetFoldersQuery = paths['/folders']['get']['parameters']['query'];
type TGetFoldersByFolderQuery = paths['/folders/content/{uuid}/folders']['get']['parameters']['query'];
type TGetFilesByFolderQuery = paths['/folders/content/{uuid}/files']['get']['parameters']['query'];

export class FoldersService {
  getMetadata({ folderId }: { folderId: number }) {
    const promise = client.GET('/folders/{id}/metadata', {
      params: { path: { id: folderId } },
    });

    return clientWrapper({
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

  getMetadataWithUuid({ uuid }: { uuid: string }) {
    const promise = client.GET('/folders/{uuid}/meta', {
      params: { path: { uuid } },
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Get folder metadata request was not successful',
        context: {
          uuid,
        },
        attributes: {
          method: 'GET',
          endpoint: '/folders/{uuid}/meta',
        },
      },
    });
  }

  getFolders({ query }: { query: TGetFoldersQuery }) {
    const promise = client.GET('/folders', { params: { query } });

    return clientWrapper({
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

    const res = await clientWrapper({
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

  async getFilesByFolder({ folderUuid, query }: { folderUuid: string; query: TGetFilesByFolderQuery }) {
    const promise = client.GET('/folders/content/{uuid}/files', {
      params: { path: { uuid: folderUuid }, query },
    });

    const res = await clientWrapper({
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

  moveFolder({ uuid, parentUuid }: { uuid: string; parentUuid: string }) {
    const promise = client.PATCH('/folders/{uuid}', {
      params: { path: { uuid } },
      body: { destinationFolder: parentUuid },
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Move folder request was not successful',
        context: {
          uuid,
          parentUuid,
        },
        attributes: {
          method: 'PATCH',
          endpoint: '/folders/{uuid}',
        },
      },
    });
  }

  renameFolder({ uuid, plainName }: { uuid: string; plainName: string }) {
    const promise = client.PUT('/folders/{uuid}/meta', {
      params: { path: { uuid } },
      body: { plainName },
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Rename folder request was not successful',
        context: {
          uuid,
          plainName,
        },
        attributes: {
          method: 'PUT',
          endpoint: '/folders/{uuid}/meta',
        },
      },
    });
  }

  existsFolder({ parentUuid, basename }: { parentUuid: string; basename: string }) {
    const promise = client.POST('/folders/content/{uuid}/folders/existence', {
      params: { path: { uuid: parentUuid } },
      body: { plainNames: [basename] },
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Check folder existence request was not successful',
        context: {
          parentUuid,
          basename,
        },
        attributes: {
          method: 'POST',
          endpoint: '/folders/content/{uuid}/folders/existence',
        },
      },
    });
  }
}
