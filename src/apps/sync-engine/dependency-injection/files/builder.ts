import { DependencyInjectionEventRepository } from '../common/eventRepository';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { FoldersContainer } from '../folders/FoldersContainer';
import { SharedContainer } from '../shared/SharedContainer';
import { FilesContainer } from './FilesContainer';
import { FileCreator } from '../../../../context/virtual-drive/files/application/FileCreator';
import { FileDeleter } from '../../../../context/virtual-drive/files/application/FileDeleter';
import { FilePathUpdater } from '../../../../context/virtual-drive/files/application/FilePathUpdater';
import { SameFileWasMoved } from '../../../../context/virtual-drive/files/application/SameFileWasMoved';
import { InMemoryFileRepository } from '../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { NodeWinLocalFileSystem } from '../../../../context/virtual-drive/files/infrastructure/NodeWinLocalFileSystem';
import { LocalFileIdProvider } from '../../../../context/virtual-drive/shared/application/LocalFileIdProvider';
import { FileFolderContainerDetector } from '../../../../context/virtual-drive/files/application/FileFolderContainerDetector';
import { FileSyncronizer } from '../../../../context/virtual-drive/files/application/FileSyncronizer';
import { FileSyncStatusUpdater } from '../../../../context/virtual-drive/files/application/FileSyncStatusUpdater';
import { FileContentsUpdater } from '../../../../context/virtual-drive/files/application/FileContentsUpdater';
import { FileContentsHardUpdater } from '../../../..//context/virtual-drive/files/application/FileContentsHardUpdater';
import { FileCheckerStatusInRoot } from '../../../../context/virtual-drive/files/application/FileCheckerStatusInRoot';
import { FilesPlaceholderDeleter } from '../../../../context/virtual-drive/files/application/FilesPlaceholderDeleter';
import { FileIdentityUpdater } from '../../../../context/virtual-drive/files/application/FileIndetityUpdater';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { getConfig } from '../../config';
import { FileOverwriteContent } from '../../../../context/virtual-drive/files/application/FileOverwriteContent';
import { ContentsContainer } from '../contents/ContentsContainer';
import { FilesPlaceholderUpdater } from '@/context/virtual-drive/files/application/update/FilesPlaceholderUpdater';

export function buildFilesContainer(
  folderContainer: FoldersContainer,
  sharedContainer: SharedContainer,
  contentsContainer: ContentsContainer,
): {
  container: FilesContainer;
  subscribers: unknown;
} {
  const eventHistory = DependencyInjectionEventRepository.get();
  const { virtualDrive } = DependencyInjectionVirtualDrive;

  const remoteFileSystem = new HttpRemoteFileSystem(getConfig().bucket, getConfig().workspaceId);
  const localFileSystem = new NodeWinLocalFileSystem(virtualDrive, sharedContainer.relativePathToAbsoluteConverter);

  const repository = new InMemoryFileRepository();

  const fileDeleter = new FileDeleter(localFileSystem, repository, folderContainer.allParentFoldersStatusIsExists);

  const fileFolderContainerDetector = new FileFolderContainerDetector(repository, folderContainer.folderFinder);

  const sameFileWasMoved = new SameFileWasMoved(repository, localFileSystem, eventHistory);

  const filePathUpdater = new FilePathUpdater(repository, folderContainer.folderFinder);

  const fileCreator = new FileCreator(remoteFileSystem, repository, folderContainer.folderFinder, fileDeleter);

  const localFileIdProvider = new LocalFileIdProvider(sharedContainer.relativePathToAbsoluteConverter);

  const filesPlaceholderUpdater = new FilesPlaceholderUpdater(
    repository,
    localFileSystem,
    sharedContainer.relativePathToAbsoluteConverter,
    localFileIdProvider,
    eventHistory,
  );

  const filesPlaceholderDeleter = new FilesPlaceholderDeleter(virtualDrive);

  const fileSyncStatusUpdater = new FileSyncStatusUpdater(localFileSystem);

  const fileContentsUpdater = new FileContentsUpdater(repository);

  const fileContentsHardUpdate = new FileContentsHardUpdater(remoteFileSystem);

  const fileIdentityUpdater = new FileIdentityUpdater(localFileSystem);

  const filesCheckerStatusInRoot = new FileCheckerStatusInRoot(virtualDrive);

  const fileOverwriteContent = new FileOverwriteContent(repository, filesCheckerStatusInRoot, fileContentsHardUpdate);

  const fileSyncronizer = new FileSyncronizer(
    repository,
    fileSyncStatusUpdater,
    virtualDrive,
    fileIdentityUpdater,
    fileCreator,
    sharedContainer.absolutePathToRelativeConverter,
    folderContainer.folderCreator,
    folderContainer.offline.folderCreator,
    fileContentsUpdater,
    contentsContainer.contentsUploader,
  );

  const container: FilesContainer = {
    fileRepository: repository,
    fileDeleter,
    filePathUpdater,
    fileCreator,
    fileFolderContainerDetector,
    fileSyncronizer,
    sameFileWasMoved,
    filesPlaceholderUpdater,
    filesPlaceholderDeleter,
    fileSyncStatusUpdater,
    filesCheckerStatusInRoot,
    fileIdentityUpdater,
    fileOverwriteContent,
  };

  return { container, subscribers: [] };
}
