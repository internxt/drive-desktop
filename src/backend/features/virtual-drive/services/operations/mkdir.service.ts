import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Container } from 'diod';
import { basename } from 'node:path';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { Result } from '../../../../../context/shared/domain/Result';
import { FolderCreator } from '../../../../../context/virtual-drive/folders/application/create/FolderCreator';
import { SyncFolderMessenger } from '../../../../../context/virtual-drive/folders/domain/SyncFolderMessenger';
import { VirtualDriveFolderIssue } from '../../../../../shared/issues/VirtualDriveIssue';

export async function mkdir(path: string, container: Container): Promise<Result<void, FuseError>> {
  if (path.startsWith('/.Trash')) {
    return { data: undefined };
  }

  try {
    await container.get(SyncFolderMessenger).creating(path);
    await container.get(FolderCreator).run(path);
    await container.get(SyncFolderMessenger).created(path);
    return { data: undefined };
  } catch (error: unknown) {
    logger.error({ msg: '[FUSE - Mkdir] Unable to create folder', error, path });

    const issue: VirtualDriveFolderIssue = {
      error: 'FOLDER_CREATE_ERROR',
      cause: 'UNKNOWN',
      name: basename(path),
    };
    await container.get(SyncFolderMessenger).issue(issue);

    return { error: new FuseError(FuseCodes.EIO, `[FUSE - Mkdir] IO error: ${path}`) };
  }
}
