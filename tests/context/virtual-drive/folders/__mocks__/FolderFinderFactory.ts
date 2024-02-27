import { ParentFolderFinder } from '../../../../../src/context/virtual-drive/folders/application/ParentFolderFinder';
import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderMother } from '../domain/FolderMother';
import { FolderRepositoryMock } from './FolderRepositoryMock';

export class FolderFinderFactory {
  static existingFolder(folder?: Folder): ParentFolderFinder {
    const repository = new FolderRepositoryMock();

    const resolved = folder || FolderMother.any();

    repository.matchingPartialMock.mockReturnValueOnce([resolved]);

    return new ParentFolderFinder(repository);
  }
}
