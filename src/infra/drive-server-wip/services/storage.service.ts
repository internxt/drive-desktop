import { client } from '@/apps/shared/HttpClient/client';
import { noContentWrapper } from '../in/no-content-wrapper.service';
import { clientWrapper } from '../in/client-wrapper.service';

export class StorageService {
  deleteFile(context: { fileId: string }) {
    const promise = noContentWrapper({
      request: client.DELETE('/storage/trash/file/{fileId}', {
        params: { path: { fileId: context.fileId } },
      }),
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Delete file request was not successful',
        context,
        attributes: {
          method: 'DELETE',
          endpoint: '/storage/trash/file/{fileId}',
        },
      },
    });
  }

  deleteFolder(context: { folderId: number }) {
    const promise = noContentWrapper({
      request: client.DELETE('/storage/trash/folder/{folderId}', {
        params: { path: { folderId: context.folderId } },
      }),
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Delete folder request was not successful',
        context,
        attributes: {
          method: 'DELETE',
          endpoint: '/storage/trash/folder/{folderId}',
        },
      },
    });
  }

  deleteFileByUuid(context: { uuid: string }) {
    const promise = noContentWrapper({
      request: client.POST('/storage/trash/add', {
        body: { items: [{ type: 'file', uuid: context.uuid, id: null }] },
      }),
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Delete file by uuid request was not successful',
        context,
        attributes: {
          method: 'POST',
          endpoint: '/storage/trash/add',
        },
      },
    });
  }

  deleteFolderByUuid(context: { uuid: string }) {
    const promise = noContentWrapper({
      request: client.POST('/storage/trash/add', {
        body: { items: [{ type: 'folder', uuid: context.uuid, id: null }] },
      }),
    });

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Delete folder by uuid request was not successful',
        context,
        attributes: {
          method: 'POST',
          endpoint: '/storage/trash/add',
        },
      },
    });
  }
}
