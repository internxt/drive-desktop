import { FolderFinder } from '../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderSearcher } from '../../../../context/virtual-drive/folders/application/FolderSearcher';
import { FoldersByParentPathLister } from '../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { InMemoryFolderRepository } from '../../../../context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { FoldersContainer } from './FoldersContainer';

export async function buildFoldersContainer(): Promise<FoldersContainer> {
  const repository = new InMemoryFolderRepository();

  const folderFinder = new FolderFinder(repository);

  const folderSearcher = new FolderSearcher(repository);

  const foldersByParentPathSearcher = new FoldersByParentPathLister(
    folderFinder,
    repository
  );

  return {
    folderFinder,
    folderSearcher,
    foldersByParentPathSearcher,
  };
}
