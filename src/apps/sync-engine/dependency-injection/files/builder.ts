import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { FoldersContainer } from '../folders/FoldersContainer';
import { SharedContainer } from '../shared/SharedContainer';
import { FilesContainer } from './FilesContainer';
import { FileCreator } from '../../../../context/virtual-drive/files/application/FileCreator';
import { FileDeleter } from '../../../../context/virtual-drive/files/application/FileDeleter';
import { FilePathUpdater } from '../../../../context/virtual-drive/files/application/FilePathUpdater';
import { InMemoryFileRepository } from '../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { NodeWinLocalFileSystem } from '../../../../context/virtual-drive/files/infrastructure/NodeWinLocalFileSystem';
import { FileFolderContainerDetector } from '../../../../context/virtual-drive/files/application/FileFolderContainerDetector';
import { FileContentsHardUpdater } from '../../../..//context/virtual-drive/files/application/FileContentsHardUpdater';
import { FileCheckerStatusInRoot } from '../../../../context/virtual-drive/files/application/FileCheckerStatusInRoot';
import { FilesPlaceholderDeleter } from '../../../../context/virtual-drive/files/application/FilesPlaceholderDeleter';
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
  const localFileSystem = new NodeWinLocalFileSystem(virtualDrive);

  const repository = new InMemoryFileRepository();

  const fileDeleter = new FileDeleter(localFileSystem, repository, folderContainer.allParentFoldersStatusIsExists);

  const fileFolderContainerDetector = new FileFolderContainerDetector(repository, folderContainer.folderFinder);

  const filePathUpdater = new FilePathUpdater(repository, folderContainer.folderFinder);

  const fileCreator = new FileCreator(remoteFileSystem, repository, virtualDrive);

  const filesPlaceholderUpdater = new FilesPlaceholderUpdater(repository, localFileSystem, sharedContainer.relativePathToAbsoluteConverter);

  const filesPlaceholderDeleter = new FilesPlaceholderDeleter(virtualDrive);

  const fileContentsHardUpdate = new FileContentsHardUpdater(remoteFileSystem);

  const filesCheckerStatusInRoot = new FileCheckerStatusInRoot(virtualDrive);

  const fileOverwriteContent = new FileOverwriteContent(repository, filesCheckerStatusInRoot, fileContentsHardUpdate);

  const container: FilesContainer = {
    fileRepository: repository,
    fileDeleter,
    filePathUpdater,
    fileCreator,
    fileFolderContainerDetector,
    filesPlaceholderUpdater,
    filesPlaceholderDeleter,
    filesCheckerStatusInRoot,
    fileOverwriteContent,
  };

  return { container, subscribers: [] };
}
