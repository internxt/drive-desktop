import { client } from '@/apps/shared/HttpClient/client';
import { noContentWrapper } from '../in/no-content-wrapper.service';
import { clientWrapper } from '../in/client-wrapper.service';
import { getRequestKey } from '../in/get-in-flight-request';

export const storage = {
  deleteFile,
  deleteFolder,
  deleteFileByUuid,
  deleteFolderByUuid,
};

async function deleteFile(context: { fileId: string }) {
  const method = 'DELETE';
  const endpoint = '/storage/trash/file/{fileId}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    noContentWrapper({
      request: client.DELETE(endpoint, {
        params: { path: { fileId: context.fileId } },
      }),
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Delete file request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function deleteFolder(context: { folderId: number }) {
  const method = 'DELETE';
  const endpoint = '/storage/trash/folder/{folderId}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    noContentWrapper({
      request: client.DELETE(endpoint, {
        params: { path: { folderId: context.folderId } },
      }),
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Delete folder request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function deleteFileByUuid(context: { uuid: string; workspaceToken: string }) {
  const method = 'POST';
  const endpoint = '/storage/trash/add';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    noContentWrapper({
      request: client.POST(endpoint, {
        headers: { 'x-internxt-workspace': context.workspaceToken },
        body: { items: [{ type: 'file', uuid: context.uuid, id: null }] },
      }),
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Delete file by uuid request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function deleteFolderByUuid(context: { uuid: string }) {
  const method = 'POST';
  const endpoint = '/storage/trash/add';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    noContentWrapper({
      request: client.POST(endpoint, {
        body: { items: [{ type: 'folder', uuid: context.uuid, id: null }] },
      }),
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Delete folder by uuid request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}
