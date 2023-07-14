import { Readable } from 'stream';
import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { WebdavServerEventBus } from '../../../shared/domain/WebdavServerEventBus';
import { WebdavFileDownloader } from '../../application/WebdavFileDownloader';
import { WebdavFileMother } from '../domain/WebdavFileMother';
import { FileContentRepositoryMock } from '../__mocks__/FileContentRepositoryMock';
import { WebdavFileRepositoryMock } from '../__mocks__/WebdavFileRepositoyMock';
import { FilePath } from '../../domain/FilePath';
import { WebdavIpcMock } from '../../../shared/test/__mock__/WebdavIPC';
describe('Webdav File Downloader', () => {
  let repository: WebdavFileRepositoryMock;
  let contentsRepository: FileContentRepositoryMock;
  let eventBus: WebdavServerEventBus;
  let SUT: WebdavFileDownloader;
  let ipc: WebdavIpcMock;

  beforeEach(() => {
    repository = new WebdavFileRepositoryMock();
    contentsRepository = new FileContentRepositoryMock();
    eventBus = new EventBusMock();
    ipc = new WebdavIpcMock();

    SUT = new WebdavFileDownloader(
      repository,
      contentsRepository,
      eventBus,
      ipc
    );
  });

  it('Gets the a readable stream when the path is founded', async () => {
    const folderPath = 'Omuseha/Ufbihtot/Wukwige';
    const file = WebdavFileMother.onFolderName(folderPath);

    repository.mockSearch.mockReturnValueOnce(file);
    contentsRepository.mockDownload.mock.mockResolvedValueOnce(new Readable());

    const readable = await SUT.run(file.path.value);

    expect(readable).toBeDefined();

    expect(repository.mockSearch).toHaveBeenCalledWith(
      new FilePath(file.path.value)
    );
    expect(contentsRepository.mockDownload.mock).toHaveBeenCalled();
  });

  it('Throws an exception if the path is not founded', async () => {
    const path = 'Omuseha/Ufbihtot/Wukwige/Invoice.pdf';

    repository.mockSearch.mockReturnValueOnce(undefined);

    try {
      const readable = await SUT.run(path);
      expect(readable).not.toBeDefined();
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});
