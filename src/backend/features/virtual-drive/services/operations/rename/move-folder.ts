import { Container } from 'diod';
import { basename } from 'node:path';
import { FolderPathUpdater } from '../../../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { Folder } from '../../../../../../context/virtual-drive/folders/domain/Folder';
import { FolderPath } from '../../../../../../context/virtual-drive/folders/domain/FolderPath';
import { SyncFolderMessenger } from '../../../../../../context/virtual-drive/folders/domain/SyncFolderMessenger';
import { Result } from '../../../../../../context/shared/domain/Result';
import { FuseError, FuseUnknownError } from '../../../../../../apps/drive/fuse/callbacks/FuseErrors';

type Props = {
  folder: Folder;
  src: string;
  dest: string;
  container: Container;
};

export async function moveFolder({ folder, src, dest, container }: Props): Promise<Result<void, FuseError>> {
  try {
    const desiredPath = new FolderPath(dest);

    await container.get(SyncFolderMessenger).rename(folder.name, desiredPath.name());
    await container.get(FolderPathUpdater).run(folder.uuid, dest);
    await container.get(SyncFolderMessenger).renamed(folder.name, desiredPath.name());

    return { data: undefined };
  } catch (error) {
    await container.get(SyncFolderMessenger).issue({
      error: 'FOLDER_RENAME_ERROR',
      cause: 'UNKNOWN',
      name: basename(src),
    });

    return { error: error instanceof FuseError ? error : new FuseUnknownError() };
  }
}
