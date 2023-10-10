import { ContentsDownloader } from '../../application/ContentsDownloader';
import { FileMother } from '../../../files/test/domain/FileMother';
import { RemoteFileContentsManagersFactoryMock } from '../__mocks__/RemoteFileContentsManagersFactoryMock';
import { IpcRendererSyncEngineMock } from '../../../shared/test/__mock__/IpcRendererSyncEngineMock';
import { FileDownloadEvents } from '../../domain/contentHandlers/ContentFileDownloader';
import { ReadableHelloWorld } from '../__mocks__/ReadableHelloWorld';
import { LocalFileWriterMock } from '../__mocks__/LocalFileWriterMock';
import { temporalFolderProvider } from '../../application/temporalFolderProvider';

describe('Contents Downloader', () => {
  let localWriter: LocalFileWriterMock;
  let factory: RemoteFileContentsManagersFactoryMock;
  let ipc: IpcRendererSyncEngineMock;

  let SUT: ContentsDownloader;

  beforeEach(() => {
    factory = new RemoteFileContentsManagersFactoryMock();
    localWriter = new LocalFileWriterMock();
    ipc = new IpcRendererSyncEngineMock();

    SUT = new ContentsDownloader(
      factory,
      localWriter,
      ipc,
      temporalFolderProvider
    );
  });

  it.each(['start', 'progress', 'finish', 'error'] satisfies Array<
    keyof FileDownloadEvents
  >)(
    'tracks all the manager events ',
    async (event: keyof FileDownloadEvents) => {
      factory.mockDownloader.mock.mockResolvedValueOnce(
        new ReadableHelloWorld()
      );

      await SUT.run(FileMother.any(), () => {
        /* do nothing */
        return true;
      });

      expect(factory.mockDownloader.onMock).toBeCalledWith(
        event,
        expect.any(Function)
      );
    }
  );

  it('writes the downloaded content a local file', async () => {
    factory.mockDownloader.mock.mockResolvedValueOnce(new ReadableHelloWorld());

    const file = FileMother.any();
    await SUT.run(file, () => {
      return true;
    });

    expect(localWriter.writeMock).toBeCalledWith(
      expect.objectContaining({
        name: file.name,
        extension: file.type,
        size: file.size,
      })
    );
  });
});
