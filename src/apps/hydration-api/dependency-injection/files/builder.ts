import { FilesByFolderPathSearcher } from '../../../../context/virtual-drive/files/application/FilesByFolderPathSearcher';
import { FilesSearcher } from '../../../../context/virtual-drive/files/application/FilesSearcher';
import { RepositoryPopulator } from '../../../../context/virtual-drive/files/application/RepositoryPopulator';
import { File } from '../../../../context/virtual-drive/files/domain/File';
import { InMemoryFileRepository } from '../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { FoldersContainer } from '../folders/FoldersContainer';
import { FilesContainer } from './FilesContainer';

export async function buildFilesContainer(
  initialFiles: Array<File>,
  folderContainer: FoldersContainer
): Promise<FilesContainer> {
  const repository = new InMemoryFileRepository();

  const repositoryPopulator = new RepositoryPopulator(repository);

  await repositoryPopulator.run(initialFiles);

  const filesByFolderPathNameLister = new FilesByFolderPathSearcher(
    repository,
    folderContainer.folderFinder
  );

  const filesSearcher = new FilesSearcher(repository);

  return {
    filesByFolderPathNameLister,
    filesSearcher,
  };
}
