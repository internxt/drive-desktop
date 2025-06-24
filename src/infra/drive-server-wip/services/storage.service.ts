import { client } from '@/apps/shared/HttpClient/client';
import { noContentWrapper } from '../in/no-content-wrapper.service';
import { clientWrapper } from '../in/client-wrapper.service';

export const storage = {
  deleteFile,
  deleteFolder,
  deleteFileByUuid,
  deleteFolderByUuid,
};

async function deleteFile(context: { fileId: string }) {
  const promise = () =>
    noContentWrapper({
      request: client.DELETE('/storage/trash/file/{fileId}', {
        params: { path: { fileId: context.fileId } },
      }),
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Delete file request',
      context,
      attributes: {
        method: 'DELETE',
        endpoint: '/storage/trash/file/{fileId}',
      },
    },
  });
}

async function deleteFolder(context: { folderId: number }) {
  const promise = () =>
    noContentWrapper({
      request: client.DELETE('/storage/trash/folder/{folderId}', {
        params: { path: { folderId: context.folderId } },
      }),
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Delete folder request',
      context,
      attributes: {
        method: 'DELETE',
        endpoint: '/storage/trash/folder/{folderId}',
      },
    },
  });
}

async function deleteFileByUuid(context: { uuid: string; workspaceToken: string }) {
  const promise = () =>
    noContentWrapper({
      request: client.POST('/storage/trash/add', {
        headers: { 'x-internxt-workspace': context.workspaceToken },
        body: { items: [{ type: 'file', uuid: context.uuid, id: null }] },
      }),
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Delete file by uuid request',
      context,
      attributes: {
        method: 'POST',
        endpoint: '/storage/trash/add',
      },
    },
  });
}

async function deleteFolderByUuid(context: { uuid: string }) {
  const promise = () =>
    noContentWrapper({
      request: client.POST('/storage/trash/add', {
        body: { items: [{ type: 'folder', uuid: context.uuid, id: null }] },
      }),
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Delete folder by uuid request',
      context,
      attributes: {
        method: 'POST',
        endpoint: '/storage/trash/add',
      },
    },
  });
}
