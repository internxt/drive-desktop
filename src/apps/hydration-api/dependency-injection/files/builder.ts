import { FilesByFolderPathSearcher } from '../../../../context/virtual-drive/files/application/FilesByFolderPathSearcher';
import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/FirstsFileSearcher';
import { RetrieveAllFiles } from '../../../../context/virtual-drive/files/application/RetrieveAllFiles';
import { InMemoryFileRepositorySingleton } from '../../../shared/dependency-injection/virtual-drive/files/InMemoryFileRepositorySingleton';
import { FoldersContainer } from '../folders/FoldersContainer';
import { FilesContainer } from './FilesContainer';

export async function buildFilesContainer(
  folderContainer: FoldersContainer
): Promise<FilesContainer> {
  const repository = InMemoryFileRepositorySingleton.instance;

  const filesByFolderPathNameLister = new FilesByFolderPathSearcher(
    repository,
    folderContainer.parentFolderFinder
  );

  const filesSearcher = new FirstsFileSearcher(repository);

  const retrieveAllFiles = new RetrieveAllFiles(repository);

  return {
    filesByFolderPathNameLister,
    filesSearcher,
    retrieveAllFiles,
  };
}
