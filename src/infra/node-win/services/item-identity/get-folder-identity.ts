import { logger } from '@/apps/shared/logger/logger';
import { isFolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import VirtualDrive from '@/node-win/virtual-drive';

type TProps = {
  drive: VirtualDrive;
  path: string;
};

export function getFolderIdentity({ drive, path }: TProps) {
  const identity = drive.getFileIdentity({ path });
  const isFolder = isFolderPlaceholderId(identity);

  if (!identity || !isFolder) {
    return {
      error: logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Folder not found or not a folder',
        path,
        identity,
        isFolder,
      }),
    };
  }

  return { data: identity };
}
