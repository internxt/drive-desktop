import { FilePathUpdater } from '../../application/FilePathUpdater';
import { FilePath } from '../../domain/FilePath';
import { FileMother } from '../domain/FileMother';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { FolderFinder } from '../../../folders/application/FolderFinder';
import { FolderFinderMock } from '../../../folders/test/__mocks__/FolderFinderMock';
import { FileFinderByContentsId } from '../../application/FileFinderByContentsId';

describe('File path updater', () => {
  let repository: FileRepositoryMock;
  let fileFinderByContentsId: FileFinderByContentsId;
  let folderFinder: FolderFinderMock;
  let SUT: FilePathUpdater;

  beforeEach(() => {
    repository = new FileRepositoryMock();
    folderFinder = new FolderFinderMock();
    fileFinderByContentsId = new FileFinderByContentsId(repository);

    SUT = new FilePathUpdater(
      repository,
      fileFinderByContentsId,
      folderFinder as unknown as FolderFinder
    );
  });

  it('when the extension does not changes it updates the name of the file', async () => {
    const file = FileMother.any();

    repository.mockSearchByCriteria.mockReturnValue(file);

    const destination = new FilePath(
      `${file.dirname}/_${file.nameWithExtension}`
    );

    await SUT.run(file.contentsId, destination);

    expect(repository.mockUpdateName).toBeCalledWith(
      expect.objectContaining(file)
    );
  });
});
