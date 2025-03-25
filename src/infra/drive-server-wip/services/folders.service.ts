import { client } from '@/apps/shared/HttpClient/client';
import { paths } from '@/apps/shared/HttpClient/schema';
import { loggerService } from '@/apps/shared/logger/logger';

type TGetFoldersQuery = paths['/folders']['get']['parameters']['query'];
type TGetFoldersByFolderQuery = paths['/folders/content/{uuid}/folders']['get']['parameters']['query'];
type TGetFilesByFolderQuery = paths['/folders/content/{uuid}/files']['get']['parameters']['query'];

export class FoldersService {
  constructor(private readonly logger = loggerService) {}

  async getMetadata({ folderId }: { folderId: number }) {
    const res = await client.GET('/folders/{id}/metadata', {
      params: { path: { id: folderId } },
    });

    if (!res.data) {
      throw this.logger.error({
        msg: 'Get folder metadata request was not successful',
        exc: res.error,
        context: {
          folderId,
        },
        attributes: {
          endpoint: '/folders/{id}/metadata',
        },
      });
    }

    return res.data;
  }

  async getFolders({ query }: { query: TGetFoldersQuery }) {
    const res = await client.GET('/folders', { params: { query } });

    if (!res.data) {
      throw this.logger.error({
        msg: 'Get folders request was not successful',
        exc: res.error,
        context: {
          query,
        },
        attributes: {
          endpoint: '/folders',
        },
      });
    }

    return res.data;
  }

  async getFoldersByFolder({ folderUuid, query }: { folderUuid: string; query: TGetFoldersByFolderQuery }) {
    const res = await client.GET('/folders/content/{uuid}/folders', { params: { path: { uuid: folderUuid }, query } });

    if (!res.data) {
      throw this.logger.error({
        msg: 'Get folders by folder request was not successful',
        exc: res.error,
        context: {
          folderUuid,
          query,
        },
        attributes: {
          endpoint: '/folders/content/{uuid}/folders',
        },
      });
    }

    return res.data.folders;
  }

  async getFiles({ folderUuid, query }: { folderUuid: string; query: TGetFilesByFolderQuery }) {
    const res = await client.GET('/folders/content/{uuid}/files', { params: { path: { uuid: folderUuid }, query } });

    if (!res.data) {
      throw this.logger.error({
        msg: 'Get files by folder request was not successful',
        exc: res.error,
        context: {
          folderUuid,
          query,
        },
        attributes: {
          endpoint: '/folders/content/{uuid}/files',
        },
      });
    }

    return res.data.files;
  }
}
