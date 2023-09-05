import { WebdavFileRenamer } from '../../application/WebdavFileRenamer';
import { FilePath } from '../../domain/FilePath';
import { FileStatus } from '../../domain/FileStatus';
import { FileMother } from '../domain/FileMother';
import { RemoteFileContentsManagersFactoryMock } from '../../../contents/test/__mocks__/RemoteFileContentsManagersFactoryMock';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { ContentsIdMother } from '../../../contents/test/domain/ContentsIdMother';
import { WebdavFolderFinder } from '../../../folders/application/WebdavFolderFinder';
import { FolderFinderMock } from '../../../folders/test/__mocks__/FolderFinderMock';

describe('File Rename', () => {
  let repository: FileRepositoryMock;
  let contentsRepository: RemoteFileContentsManagersFactoryMock;
  let folderFinder: FolderFinderMock;
  let SUT: WebdavFileRenamer;

  beforeEach(() => {
    repository = new FileRepositoryMock();
    contentsRepository = new RemoteFileContentsManagersFactoryMock();
    folderFinder = new FolderFinderMock();
    SUT = new WebdavFileRenamer(
      repository,
      contentsRepository,
      folderFinder as unknown as WebdavFolderFinder
    );
  });

  it('when the extension does not changes it updates the name of the file', async () => {
    repository.mockSearch.mockImplementationOnce(() => {
      //no-op
    });

    const file = FileMother.any();

    const destination = new FilePath(
      `${file.dirname}/_${file.nameWithExtension}`
    );

    await SUT.run(file, destination);

    expect(repository.mockUpdateName).toBeCalledWith(
      expect.objectContaining(file)
    );
  });

  it('when the extension does not changes it does not reupload the file', async () => {
    repository.mockSearch.mockImplementationOnce(() => {
      //no-op
    });

    const file = FileMother.any();

    const destination = new FilePath(
      `${file.dirname}/_${file.nameWithExtension}`
    );

    await SUT.run(file, destination);

    expect(contentsRepository.mockClone.mock).not.toBeCalled();
  });

  it.skip('when the extension changes reupload the file', async () => {
    const cloneedContentsId = ContentsIdMother.random();

    repository.mockSearch.mockImplementationOnce(() => {
      //no-op
    });

    contentsRepository.mockClone.mock.mockResolvedValueOnce(cloneedContentsId);

    const file = FileMother.any();

    const destination = new FilePath(
      `${file.dirname}/_${file.name}.${file.type}n`
    );

    await SUT.run(file, destination);

    expect(repository.mockUpdateName).not.toBeCalled();
    expect(repository.mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        contentsId: cloneedContentsId.value,
        status: FileStatus.Exists,
      })
    );
    expect(repository.mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        contentsId: file.contentsId,
        status: FileStatus.Trashed,
      })
    );
  });

  it.skip('when the already exists a file on the destination it fails', async () => {
    const fileOnDestination = FileMother.any();

    repository.mockSearch.mockResolvedValueOnce(fileOnDestination);

    await SUT.run(FileMother.any(), fileOnDestination.path).catch((error) => {
      expect(error).toBeDefined();
    });
  });
});
