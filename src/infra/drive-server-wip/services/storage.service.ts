import { client, getWorkspaceHeader } from '@/apps/shared/HttpClient/client';
import { noContentWrapper } from '../in/no-content-wrapper.service';
import { clientWrapper } from '../in/client-wrapper.service';
import { getRequestKey } from '../in/get-in-flight-request';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export const storage = {
  deleteFileByUuid,
  deleteFolderByUuid,
};

async function deleteFileByUuid(context: { path: AbsolutePath; uuid: FileUuid; workspaceToken: string }) {
  const method = 'POST';
  const endpoint = '/storage/trash/add';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    noContentWrapper({
      request: client.POST(endpoint, {
        headers: getWorkspaceHeader({ workspaceToken: context.workspaceToken }),
        body: { items: [{ type: 'file', uuid: context.uuid }] },
      }),
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Delete file by uuid request', context },
  });
}

async function deleteFolderByUuid(context: { path: AbsolutePath; uuid: FolderUuid; workspaceToken: string }) {
  const method = 'POST';
  const endpoint = '/storage/trash/add';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    noContentWrapper({
      request: client.POST(endpoint, {
        headers: getWorkspaceHeader({ workspaceToken: context.workspaceToken }),
        body: { items: [{ type: 'folder', uuid: context.uuid }] },
      }),
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Delete folder by uuid request', context },
  });
}
