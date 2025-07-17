import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { FoldersContainer } from '../folders/FoldersContainer';
import { SharedContainer } from '../shared/SharedContainer';
import { FilesContainer } from './FilesContainer';
import { FileCreator } from '../../../../context/virtual-drive/files/application/FileCreator';
import { InMemoryFileRepository } from '../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { NodeWinLocalFileSystem } from '../../../../context/virtual-drive/files/infrastructure/NodeWinLocalFileSystem';
import { FileSyncStatusUpdater } from '../../../../context/virtual-drive/files/application/FileSyncStatusUpdater';
import { FileContentsHardUpdater } from '../../../..//context/virtual-drive/files/application/FileContentsHardUpdater';
import { FileCheckerStatusInRoot } from '../../../../context/virtual-drive/files/application/FileCheckerStatusInRoot';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { getConfig } from '../../config';
import { FileOverwriteContent } from '../../../../context/virtual-drive/files/application/FileOverwriteContent';
import { FilesPlaceholderUpdater } from '@/context/virtual-drive/files/application/update/FilesPlaceholderUpdater';

export function buildFilesContainer(
  folderContainer: FoldersContainer,
  sharedContainer: SharedContainer,
): {
  container: FilesContainer;
  subscribers: unknown;
} {
  const { virtualDrive } = DependencyInjectionVirtualDrive;

  const remoteFileSystem = new HttpRemoteFileSystem(getConfig().bucket, getConfig().workspaceId);
  const localFileSystem = new NodeWinLocalFileSystem(virtualDrive, sharedContainer.relativePathToAbsoluteConverter);

  const repository = new InMemoryFileRepository();

  const fileCreator = new FileCreator(remoteFileSystem, repository, virtualDrive);

  const filesPlaceholderUpdater = new FilesPlaceholderUpdater(repository, localFileSystem, sharedContainer.relativePathToAbsoluteConverter);

  const fileSyncStatusUpdater = new FileSyncStatusUpdater(localFileSystem);

  const fileContentsHardUpdate = new FileContentsHardUpdater(remoteFileSystem);

  const filesCheckerStatusInRoot = new FileCheckerStatusInRoot(virtualDrive);

  const fileOverwriteContent = new FileOverwriteContent(repository, filesCheckerStatusInRoot, fileContentsHardUpdate);

  const container: FilesContainer = {
    fileRepository: repository,
    fileCreator,
    filesPlaceholderUpdater,
    fileSyncStatusUpdater,
    filesCheckerStatusInRoot,
    fileOverwriteContent,
  };

  return { container, subscribers: [] };
}
