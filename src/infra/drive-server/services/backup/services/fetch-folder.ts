import fetch from 'electron-fetch';
import { components } from '../../../../schemas';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';

export async function fetchFolder(
  folderUuid: string
): Promise<components['schemas']['GetFolderContentDto']> {
  const res = await fetch(
    `${process.env.NEW_DRIVE_URL}/folders/content/${folderUuid}`,
    {
      method: 'GET',
      headers: getNewApiHeaders(),
    }
  );

  const responseBody: components['schemas']['GetFolderContentDto'] = await res
    .json()
    .catch(() => null);

  if (res.ok) {
    if (responseBody?.deleted || responseBody?.removed) {
      throw new Error('Folder does not exist');
    }
    return responseBody;
  }
  throw new Error('Unsuccesful request to fetch folder');
}
