import { fetchFileMetaByPath } from '../../../../infra/drive-server/services/files/services/fetch-file-meta-by-path';
import { fetchFolderMetaByPath } from '../../../../infra/drive-server/services/folder/services/fetch-folder-meta-by-path';
import { ShareableItem } from './types';

type Props = {
  path: string;
};

export async function resolveShareableItem({ path }: Props) {
  const candidatePaths = Array.from(new Set([path, path.startsWith('/') ? path.slice(1) : `/${path}`].filter(Boolean)));

  for (const candidatePath of candidatePaths) {
    const fileMeta = await tryGetFileMeta({ path: candidatePath });

    if (fileMeta) {
      return {
        itemId: fileMeta.uuid,
        itemType: 'file',
      } satisfies ShareableItem;
    }

    const folderMeta = await tryGetFolderMeta({ path: candidatePath });

    if (folderMeta) {
      return {
        itemId: folderMeta.uuid,
        itemType: 'folder',
      } satisfies ShareableItem;
    }
  }

  throw new Error(`No Internxt item metadata found for path: ${path}`);
}

async function tryGetFileMeta({ path }: { path: string }) {
  const result = await fetchFileMetaByPath({ path });

  if (result.error) {
    if (result.error.cause === 'NOT_FOUND') {
      return null;
    }

    throw new Error(`Error while fetching file metadata by path: ${result.error.message}`);
  }

  return result.data;
}

async function tryGetFolderMeta({ path }: { path: string }) {
  const result = await fetchFolderMetaByPath({ path });

  if (result.error) {
    if (result.error.cause === 'NOT_FOUND') {
      return null;
    }

    throw new Error(`Error while fetching folder metadata by path: ${result.error.message}`);
  }

  return result.data;
}
