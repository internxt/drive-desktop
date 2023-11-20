import { FolderFinder } from '../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderRepositoryInitiator } from '../../../../context/virtual-drive/folders/application/FolderRepositoryInitiator';
import { FolderSearcher } from '../../../../context/virtual-drive/folders/application/FolderSearcher';
import { FoldersByParentPathSearcher } from '../../../../context/virtual-drive/folders/application/FoldersByParentPathNameLister';
import { Folder } from '../../../../context/virtual-drive/folders/domain/Folder';
import { InMemoryFolderRepository } from '../../../../context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { FoldersContainer } from './FoldersContainer';

export async function buildFoldersContainer(
  initialFolders: Array<Folder>
): Promise<FoldersContainer> {
  const repository = new InMemoryFolderRepository();

  const folderRepositoryInitiator = new FolderRepositoryInitiator(repository);

  await folderRepositoryInitiator.run(initialFolders);

  const folderFinder = new FolderFinder(repository);

  const folderSearcher = new FolderSearcher(repository);

  const foldersByParentPathSearcher = new FoldersByParentPathSearcher(
    folderFinder,
    repository
  );

  return {
    folderFinder,
    folderSearcher,
    foldersByParentPathSearcher,
  };
}
