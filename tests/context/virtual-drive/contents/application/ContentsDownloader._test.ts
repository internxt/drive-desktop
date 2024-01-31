import { ContentsDownloader } from '../../../../../src/context/virtual-drive/contents/application/ContentsDownloader';
import { FileDownloadEvents } from '../../../../../src/context/virtual-drive/contents/domain/contentHandlers/ContentFileDownloader';
import { FileMother } from '../../files/domain/FileMother';
import { EventBusMock } from '../../shared/__mock__/EventBusMock';
import { IpcRendererSyncEngineMock } from '../../shared/__mock__/IpcRendererSyncEngineMock';
import { LocalFileContentsDirectoryProviderMock } from '../__mocks__/LocalFileContentsDirectoryProviderMock';
import { LocalFileSystemMock } from '../__mocks__/LocalFileWriterMock';
import { ReadableHelloWorld } from '../__mocks__/ReadableHelloWorld';
import { RemoteFileContentsManagersFactoryMock } from '../__mocks__/RemoteFileContentsManagersFactoryMock';

describe.skip('Contents Downloader', () => {
  let localFileSystem: LocalFileSystemMock;
  let factory: RemoteFileContentsManagersFactoryMock;
  let localFileContentsDirectoryProviderMock: LocalFileContentsDirectoryProviderMock;
  let ipc: IpcRendererSyncEngineMock;
  let eventBus: EventBusMock;

  let SUT: ContentsDownloader;

  beforeEach(() => {
    factory = new RemoteFileContentsManagersFactoryMock();
    localFileSystem = new LocalFileSystemMock();
    localFileContentsDirectoryProviderMock =
      new LocalFileContentsDirectoryProviderMock();
    ipc = new IpcRendererSyncEngineMock();
    eventBus = new EventBusMock();

    SUT = new ContentsDownloader(
      factory,
      localFileSystem,
      ipc,
      localFileContentsDirectoryProviderMock,
      eventBus
    );
  });

  it.each(['start', 'progress', 'finish', 'error'] satisfies Array<
    keyof FileDownloadEvents
  >)(
    'tracks all the manager events ',
    async (event: keyof FileDownloadEvents) => {
      factory.mockDownloader.downloadMock.mockResolvedValueOnce(
        new ReadableHelloWorld()
      );

      await SUT.run(FileMother.any(), async () => {
        /* do nothing */
        return { finished: true, progress: 100 };
      });

      expect(factory.mockDownloader.onMock).toBeCalledWith(
        event,
        expect.any(Function)
      );
    }
  );

  it('writes the downloaded content a local file', async () => {
    factory.mockDownloader.downloadMock.mockResolvedValueOnce(
      new ReadableHelloWorld()
    );

    const file = FileMother.any();
    await SUT.run(file, async () => {
      /* do nothing */
      return { finished: true, progress: 100 };
    });

    expect(localFileSystem.writeMock).toBeCalledWith(
      expect.objectContaining({
        name: file.name,
        extension: file.type,
        size: file.size,
      })
    );
  });
});
