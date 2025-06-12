import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  serverFolder: FolderDto;
  currentFolder: Folder;
};

export function processFolder({ serverFolder, currentFolder }: TProps) {
  try {
    const decryptedName = Folder.decryptName({
      plainName: serverFolder.plainName,
      name: serverFolder.name,
      parentId: serverFolder.parentId,
    });

    const relativePath = createRelativePath(currentFolder.path, decryptedName);

    const folder = Folder.from({
      ...serverFolder,
      parentUuid: serverFolder.parentUuid || null,
      path: relativePath,
    });

    return { relativePath, folder };
  } catch (exc) {
    /**
     * v2.5.3 Daniel Jiménez
     * TODO: Add issue to backups
     */

    logger.error({
      tag: 'BACKUPS',
      msg: 'Error adding folder to tree',
      exc,
    });
  }
}
