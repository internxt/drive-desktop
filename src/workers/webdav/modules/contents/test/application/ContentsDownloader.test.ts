import { ContentsDownloader } from '../../application/ContentsDownloader';
import { FileMother } from '../../../files/test/domain/FileMother';
import { RemoteFileContentsManagersFactoryMock } from '../__mocks__/RemoteFileContentsManagersFactoryMock';
import { WebdavIpcMock } from '../../../shared/test/__mock__/WebdavIPC';
import { FileDownloadEvents } from '../../domain/contentHandlers/ContentFileDownloader';
import { ReadableHelloWorld } from '../__mocks__/ReadableHelloWorld';
import { LocalFileWriterMock } from '../__mocks__/LocalFileWriterMock';

describe('Contents Downloader', () => {
  let localWriter: LocalFileWriterMock;
  let factory: RemoteFileContentsManagersFactoryMock;
  let ipc: WebdavIpcMock;

  let SUT: ContentsDownloader;

  beforeEach(() => {
    factory = new RemoteFileContentsManagersFactoryMock();
    localWriter = new LocalFileWriterMock();
    ipc = new WebdavIpcMock();

    SUT = new ContentsDownloader(factory, localWriter, ipc);
  });

  it.each(['start', 'progress', 'finish', 'error'] satisfies Array<
    keyof FileDownloadEvents
  >)(
    'tracks all the manager events ',
    async (event: keyof FileDownloadEvents) => {
      factory.mockDownloader.mock.mockResolvedValueOnce(
        new ReadableHelloWorld()
      );

      await SUT.run(FileMother.any());

      expect(factory.mockDownloader.onMock).toBeCalledWith(
        event,
        expect.any(Function)
      );
    }
  );

  it('writes the downloaded content a local file', async () => {
    factory.mockDownloader.mock.mockResolvedValueOnce(new ReadableHelloWorld());

    const file = FileMother.any();
    await SUT.run(file);

    expect(localWriter.writeMock).toBeCalledWith(
      expect.objectContaining({
        name: file.name,
        extension: file.type,
        size: file.size,
      })
    );
  });
});
