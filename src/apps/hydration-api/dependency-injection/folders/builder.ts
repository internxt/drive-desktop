import { ParentFolderFinder } from '../../../../context/virtual-drive/folders/application/ParentFolderFinder';
import { FoldersByParentPathLister } from '../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { InMemoryFolderRepository } from '../../../../context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { FoldersContainer } from './FoldersContainer';
import { SingleFolderMatchingFinder } from '../../../../context/virtual-drive/folders/application/SingleFolderMatchingFinder';

export async function buildFoldersContainer(): Promise<FoldersContainer> {
  const repository = new InMemoryFolderRepository();

  const parentFolderFinder = new ParentFolderFinder(repository);
  const singleFolderMatchingFinder = new SingleFolderMatchingFinder(repository);

  const foldersByParentPathSearcher = new FoldersByParentPathLister(
    singleFolderMatchingFinder,
    repository
  );

  return {
    parentFolderFinder,
    foldersByParentPathSearcher,
    singleFolderMatchingFinder,
  };
}
