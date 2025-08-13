import { SharedContainer } from '../shared/SharedContainer';
import { FilesContainer } from './FilesContainer';
import { InMemoryFileRepository } from '../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { FileContentsHardUpdater } from '../../../..//context/virtual-drive/files/application/FileContentsHardUpdater';
import { FileCheckerStatusInRoot } from '../../../../context/virtual-drive/files/application/FileCheckerStatusInRoot';
import { FileOverwriteContent } from '../../../../context/virtual-drive/files/application/FileOverwriteContent';
import { FilePlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-file-placeholder';
import { ContentsContainer } from '../contents/ContentsContainer';
import { virtualDrive } from '../common/virtualDrive';

export function buildFilesContainer(
  contentsContainer: ContentsContainer,
  sharedContainer: SharedContainer,
): {
  container: FilesContainer;
  subscribers: unknown;
} {
  const repository = new InMemoryFileRepository();

  const filePlaceholderUpdater = new FilePlaceholderUpdater(virtualDrive, sharedContainer.relativePathToAbsoluteConverter);

  const fileContentsHardUpdate = new FileContentsHardUpdater(
    contentsContainer.contentsUploader,
    sharedContainer.relativePathToAbsoluteConverter,
  );

  const filesCheckerStatusInRoot = new FileCheckerStatusInRoot(virtualDrive);

  const fileOverwriteContent = new FileOverwriteContent(repository, filesCheckerStatusInRoot, fileContentsHardUpdate);

  const container: FilesContainer = {
    fileRepository: repository,
    filePlaceholderUpdater,
    filesCheckerStatusInRoot,
    fileOverwriteContent,
  };

  return { container, subscribers: [] };
}
