import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { WebdavFileRenamer } from '../../application/WebdavFileRenamer';
import { FilePath } from '../../domain/FilePath';
import { FileStatus } from '../../domain/FileStatus';
import { WebdavFileMother } from '../domain/WebdavFileMother';
import { FileContentRepositoryMock } from '../__mocks__/FileContentRepositoryMock';
import { WebdavFileRepositoryMock } from '../__mocks__/WebdavFileRepositoyMock';
import { WebdavIpcMock } from '../../../shared/test/__mock__/WebdavIPC';

describe('File Rename', () => {
  let repository: WebdavFileRepositoryMock;
  let contentsRepository: FileContentRepositoryMock;
  let eventBus: EventBusMock;
  let ipc: WebdavIpcMock;
  let SUT: WebdavFileRenamer;

  beforeEach(() => {
    repository = new WebdavFileRepositoryMock();
    contentsRepository = new FileContentRepositoryMock();
    eventBus = new EventBusMock();
    ipc = new WebdavIpcMock();
    SUT = new WebdavFileRenamer(repository, contentsRepository, eventBus, ipc);
  });

  it('when the extension does not changes it updates the name of the file', async () => {
    repository.mockSearch.mockImplementationOnce(() => {
      //no-op
    });

    const file = WebdavFileMother.any();

    const destination = new FilePath(
      `${file.dirname}/_${file.nameWithExtension}`
    );

    await SUT.run(file, destination.value);

    expect(repository.mockUpdateName).toBeCalledWith(
      expect.objectContaining(file)
    );
  });

  it('when the extension does not changes it does not reupload the file', async () => {
    repository.mockSearch.mockImplementationOnce(() => {
      //no-op
    });

    const file = WebdavFileMother.any();

    const destination = new FilePath(
      `${file.dirname}/_${file.nameWithExtension}`
    );

    await SUT.run(file, destination.value);

    expect(contentsRepository.mockClone.mock).not.toBeCalled();
  });

  it('when the extension changes reupload the file', async () => {
    const cloneedFileId = '88db6888-586b-52d5-9af0-6b6397b4f35f';

    repository.mockSearch.mockImplementationOnce(() => {
      //no-op
    });

    contentsRepository.mockClone.mock.mockResolvedValueOnce(cloneedFileId);

    const file = WebdavFileMother.any();

    const destination = new FilePath(
      `${file.dirname}/_${file.name}.${file.type}n`
    );

    await SUT.run(file, destination.value);

    expect(repository.mockUpdateName).not.toBeCalled();
    expect(repository.mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: cloneedFileId,
        status: FileStatus.Exists,
      })
    );
    expect(repository.mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: file.fileId,
        status: FileStatus.Trashed,
      })
    );
  });

  it('when the already exists a file on the destination it fails', async () => {
    const fileOnDestination = WebdavFileMother.any();

    repository.mockSearch.mockResolvedValueOnce(fileOnDestination);

    await SUT.run(WebdavFileMother.any(), fileOnDestination.path.value).catch(
      (error) => {
        expect(error).toBeDefined();
      }
    );
  });
});
