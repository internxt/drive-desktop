import fetch from 'electron-fetch';
import { getNewApiHeadersIPC } from '../../../../../infra/ipc/get-new-api-headers-ipc';

export async function deleteFolder(folderId: number) {
  const headers = await getNewApiHeadersIPC();
  return fetch(`${process.env.NEW_DRIVE_URL}/storage/trash/add`, {
    method: 'POST',
    headers,
    body:  JSON.stringify({
      items: [{ type: 'folder', id: folderId }],
    }),
  });
}
