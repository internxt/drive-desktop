import { FilesContainer } from './FilesContainer';
import { InMemoryFileRepository } from '../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { FileContentsHardUpdater } from '../../../..//context/virtual-drive/files/application/FileContentsHardUpdater';
import { ProcessSyncContext } from '../../config';
import { FileOverwriteContent } from '../../../../context/virtual-drive/files/application/FileOverwriteContent';
import { SharedContainer } from '../shared/SharedContainer';

export function buildFilesContainer(
  ctx: ProcessSyncContext,
  sharedContainer: SharedContainer,
): {
  container: FilesContainer;
} {
  const repository = new InMemoryFileRepository();

  const fileContentsHardUpdate = new FileContentsHardUpdater(sharedContainer.relativePathToAbsoluteConverter);

  const fileOverwriteContent = new FileOverwriteContent(repository, fileContentsHardUpdate);

  const container: FilesContainer = {
    fileRepository: repository,
    fileOverwriteContent,
  };

  return { container };
}
