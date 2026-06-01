import { Container } from 'diod';
import { DriveDesktopError } from '../../../../../../context/shared/domain/errors/DriveDesktopError';
import { FolderDeleter } from '../../../../../../context/virtual-drive/folders/application/FolderDeleter';
import { Folder } from '../../../../../../context/virtual-drive/folders/domain/Folder';
import { SyncFileMessenger } from '../../../../../../context/virtual-drive/files/domain/SyncFileMessenger';
import { Result } from '../../../../../../context/shared/domain/Result';
import { SyncError } from '../../../../../../shared/issues/SyncErrorCause';
import { FuseError, FuseUnknownError } from '../../../../../../apps/drive/fuse/callbacks/FuseErrors';

type Props = {
  folder: Folder;
  container: Container;
};

export async function trashFolder({ folder, container }: Props): Promise<Result<void, FuseError>> {
  try {
    await container.get(FolderDeleter).run(folder.uuid);
    return { data: undefined };
  } catch (error) {
    const cause: SyncError = error instanceof DriveDesktopError ? error.cause : 'UNKNOWN';

    await container.get(SyncFileMessenger).issues({
      error: 'DELETE_ERROR',
      cause,
      name: folder.name,
    });

    return { error: error instanceof FuseError ? error : new FuseUnknownError() };
  }
}
