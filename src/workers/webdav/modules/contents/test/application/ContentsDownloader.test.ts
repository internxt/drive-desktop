import { Readable } from 'stream';
import { ContentsDownloader } from '../../application/ContentsDownloader';
import { FileMother } from '../../../files/test/domain/FileMother';
import { RemoteFileContentsManagersFactoryMock } from '../__mocks__/RemoteFileContentsManagersFactoryMock';
import { FileRepositoryMock } from '../../../files/test/__mocks__/FileRepositoryMock';
import { FilePath } from '../../../files/domain/FilePath';
import { WebdavIpcMock } from '../../../shared/test/__mock__/WebdavIPC';
describe('Webdav File Downloader', () => {
  let repository: FileRepositoryMock;
  let contentsRepository: RemoteFileContentsManagersFactoryMock;

  let SUT: ContentsDownloader;
  let ipc: WebdavIpcMock;

  beforeEach(() => {
    repository = new FileRepositoryMock();
    contentsRepository = new RemoteFileContentsManagersFactoryMock();
    ipc = new WebdavIpcMock();

    SUT = new ContentsDownloader(repository, contentsRepository, ipc);
  });

  it('Gets the a readable stream when the path is founded', async () => {
    const folderPath = 'Omuseha/Ufbihtot/Wukwige';
    const file = FileMother.onFolderName(folderPath);

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
