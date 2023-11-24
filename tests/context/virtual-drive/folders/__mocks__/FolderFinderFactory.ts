import { FolderFinder } from '../../../../../src/context/virtual-drive/folders/application/FolderFinder';
import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderMother } from '../domain/FolderMother';
import { FolderRepositoryMock } from './FolderRepositoryMock';

export class FolderFinderFactory {
  static existingFolder(folder?: Folder): FolderFinder {
    const repository = new FolderRepositoryMock();

    const resolved = folder || FolderMother.any();

    repository.searchByPartialMock.mockResolvedValueOnce(resolved);

    return new FolderFinder(repository);
  }
}
