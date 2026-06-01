import { Container } from 'diod';
import { basename } from 'node:path';
import { DriveDesktopError } from '../../../../../../context/shared/domain/errors/DriveDesktopError';
import { FilePathUpdater } from '../../../../../../context/virtual-drive/files/application/move/FilePathUpdater';
import { File } from '../../../../../../context/virtual-drive/files/domain/File';
import { FilePath } from '../../../../../../context/virtual-drive/files/domain/FilePath';
import { SyncFileMessenger } from '../../../../../../context/virtual-drive/files/domain/SyncFileMessenger';
import { Result } from '../../../../../../context/shared/domain/Result';
import { SyncError } from '../../../../../../shared/issues/SyncErrorCause';
import { FuseError, FuseUnknownError } from '../../../../../../apps/drive/fuse/callbacks/FuseErrors';

type Props = {
  file: File;
  src: string;
  dest: string;
  container: Container;
};

export async function moveFile({ file, src, dest, container }: Props): Promise<Result<void, FuseError>> {
  try {
    const desiredPath = new FilePath(dest);

    await container.get(SyncFileMessenger).renaming(file.nameWithExtension, desiredPath.nameWithExtension());
    await container.get(FilePathUpdater).run(file.contentsId, dest);
    await container.get(SyncFileMessenger).renamed(file.nameWithExtension, desiredPath.nameWithExtension());

    return { data: undefined };
  } catch (error) {
    const cause: SyncError = error instanceof DriveDesktopError ? error.cause : 'UNKNOWN';

    await container.get(SyncFileMessenger).issues({
      error: 'RENAME_ERROR',
      cause,
      name: basename(src),
    });

    return { error: error instanceof FuseError ? error : new FuseUnknownError() };
  }
}
