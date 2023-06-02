import { Readable } from 'stream';
import { WebdavFileDownloader } from '../../application/WebdavFileDownloader';
import { WebdavFileMother } from '../domain/WebdavFileMother';
import { FileContentRepositoryMock } from '../__mocks__/FileContentRepositoryMock';
import { WebdavFileRepositoryMock } from '../__mocks__/WebdavFileRepositoyMock';

describe('Webdav File Downloader', () => {
  let repository: WebdavFileRepositoryMock;
  let contentsRepository: FileContentRepositoryMock;
  let SUT: WebdavFileDownloader;

  beforeEach(() => {
    repository = new WebdavFileRepositoryMock();
    contentsRepository = new FileContentRepositoryMock();
    SUT = new WebdavFileDownloader(repository, contentsRepository);
  });

  it('Gets the a readable stream when the path is founded', async () => {
    const folderPath = 'Omuseha/Ufbihtot/Wukwige';
    const file = WebdavFileMother.onFolderName(folderPath);

    repository.mockSearch.mockReturnValueOnce(file);
    contentsRepository.mockDownload.mockResolvedValueOnce(new Readable());

    const readable = await SUT.run(file.path.value);

    expect(readable).toBeDefined();

    expect(repository.mockSearch).toHaveBeenCalledWith(file.path.value);
    expect(contentsRepository.mockDownload).toHaveBeenCalledWith(file.fileId);
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
