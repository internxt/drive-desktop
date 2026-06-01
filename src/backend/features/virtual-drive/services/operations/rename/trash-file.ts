import { Container } from 'diod';
import { DriveDesktopError } from '../../../../../../context/shared/domain/errors/DriveDesktopError';
import { FileTrasher } from '../../../../../../context/virtual-drive/files/application/trash/FileTrasher';
import { File } from '../../../../../../context/virtual-drive/files/domain/File';
import { SyncFileMessenger } from '../../../../../../context/virtual-drive/files/domain/SyncFileMessenger';
import { Result } from '../../../../../../context/shared/domain/Result';
import { SyncError } from '../../../../../../shared/issues/SyncErrorCause';
import { FuseError, FuseUnknownError } from '../../../../../../apps/drive/fuse/callbacks/FuseErrors';

type Props = {
  file: File;
  container: Container;
};

export async function trashFile({ file, container }: Props): Promise<Result<void, FuseError>> {
  try {
    await container.get(FileTrasher).run(file.contentsId);
    return { data: undefined };
  } catch (error) {
    const cause: SyncError = error instanceof DriveDesktopError ? error.cause : 'UNKNOWN';

    await container.get(SyncFileMessenger).issues({
      error: 'DELETE_ERROR',
      cause,
      name: file.name,
    });

    return { error: error instanceof FuseError ? error : new FuseUnknownError() };
  }
}
