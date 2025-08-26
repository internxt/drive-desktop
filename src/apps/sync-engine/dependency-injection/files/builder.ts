import { FilesContainer } from './FilesContainer';
import { FileCreator } from '../../../../context/virtual-drive/files/application/FileCreator';
import { InMemoryFileRepository } from '../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { FileContentsHardUpdater } from '../../../..//context/virtual-drive/files/application/FileContentsHardUpdater';
import { FileCheckerStatusInRoot } from '../../../../context/virtual-drive/files/application/FileCheckerStatusInRoot';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { getConfig } from '../../config';
import { FileOverwriteContent } from '../../../../context/virtual-drive/files/application/FileOverwriteContent';
import { FilePlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-file-placeholder';
import { ContentsContainer } from '../contents/ContentsContainer';
import { virtualDrive } from '../common/virtualDrive';
import { SharedContainer } from '../shared/SharedContainer';

export function buildFilesContainer(
  contentsContainer: ContentsContainer,
  sharedContainer: SharedContainer,
): {
  container: FilesContainer;
} {
  const remoteFileSystem = new HttpRemoteFileSystem(getConfig().bucket, getConfig().workspaceId);

  const repository = new InMemoryFileRepository();

  const fileCreator = new FileCreator(remoteFileSystem);

  const filePlaceholderUpdater = new FilePlaceholderUpdater(virtualDrive);

  const fileContentsHardUpdate = new FileContentsHardUpdater(
    remoteFileSystem,
    contentsContainer.contentsUploader,
    sharedContainer.relativePathToAbsoluteConverter,
  );

  const filesCheckerStatusInRoot = new FileCheckerStatusInRoot(virtualDrive);

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
