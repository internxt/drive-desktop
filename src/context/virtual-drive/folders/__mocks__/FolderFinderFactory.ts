import { ParentFolderFinder } from '../application/ParentFolderFinder';
import { FolderMother } from '../domain/__test-helpers__/FolderMother';
import { Folder } from '../domain/Folder';
import { FolderRepositoryMock } from './FolderRepositoryMock';

export class FolderFinderFactory {
  static existingFolder(folder?: Folder): ParentFolderFinder {
    const repository = new FolderRepositoryMock();

    const resolved = folder || FolderMother.any();

    repository.matchingPartialMock.mockReturnValueOnce([resolved]);

    return new ParentFolderFinder(repository);
  }
}
