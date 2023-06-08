import { Readable } from 'stream';
import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { WebdavServerEventBus } from '../../../shared/domain/WebdavServerEventBus';
import { WebdavFileDownloader } from '../../application/WebdavFileDownloader';
import { WebdavFileMother } from '../domain/WebdavFileMother';
import { FileContentRepositoryMock } from '../__mocks__/FileContentRepositoryMock';
import { WebdavFileRepositoryMock } from '../__mocks__/WebdavFileRepositoyMock';
import { FilePath } from '../../domain/FilePath';

describe('Webdav File Downloader', () => {
  let repository: WebdavFileRepositoryMock;
  let contentsRepository: FileContentRepositoryMock;
  let eventBus: WebdavServerEventBus;
  let SUT: WebdavFileDownloader;

  beforeEach(() => {
    repository = new WebdavFileRepositoryMock();
    contentsRepository = new FileContentRepositoryMock();
    eventBus = new EventBusMock();
    SUT = new WebdavFileDownloader(repository, contentsRepository, eventBus);
  });

  it('Gets the a readable stream when the path is founded', async () => {
    const folderPath = 'Omuseha/Ufbihtot/Wukwige';
    const file = WebdavFileMother.onFolderName(folderPath);

    repository.mockSearch.mockReturnValueOnce(file);
    contentsRepository.mockDownload.mockResolvedValueOnce(new Readable());

    const readable = await SUT.run(file.path);

    expect(readable).toBeDefined();

    expect(repository.mockSearch).toHaveBeenCalledWith(new FilePath(file.path));
    expect(contentsRepository.mockDownload).toHaveBeenCalledWith(file);
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
