import { FilesContainer } from './FilesContainer';
import { FileCreator } from '../../../../context/virtual-drive/files/application/FileCreator';
import { InMemoryFileRepository } from '../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { FileContentsHardUpdater } from '../../../..//context/virtual-drive/files/application/FileContentsHardUpdater';
import { FileCheckerStatusInRoot } from '../../../../context/virtual-drive/files/application/FileCheckerStatusInRoot';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { ProcessSyncContext } from '../../config';
import { FileOverwriteContent } from '../../../../context/virtual-drive/files/application/FileOverwriteContent';
import { FilePlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-file-placeholder';
import { SharedContainer } from '../shared/SharedContainer';

export function buildFilesContainer(
  ctx: ProcessSyncContext,
  sharedContainer: SharedContainer,
): {
  container: FilesContainer;
} {
  const remoteFileSystem = new HttpRemoteFileSystem(ctx.bucket, ctx.workspaceId, ctx.virtualDrive);

  const repository = new InMemoryFileRepository();

  const fileCreator = new FileCreator(remoteFileSystem);

  const filePlaceholderUpdater = new FilePlaceholderUpdater(ctx.virtualDrive);

  const fileContentsHardUpdate = new FileContentsHardUpdater(remoteFileSystem, sharedContainer.relativePathToAbsoluteConverter);

  const filesCheckerStatusInRoot = new FileCheckerStatusInRoot(ctx.virtualDrive);

  const fileOverwriteContent = new FileOverwriteContent(repository, filesCheckerStatusInRoot, fileContentsHardUpdate);

  const container: FilesContainer = {
    fileRepository: repository,
    fileCreator,
    filePlaceholderUpdater,
    filesCheckerStatusInRoot,
    fileOverwriteContent,
  };

  return { container };
}
