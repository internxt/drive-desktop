import { ContentsDownloader } from '../../../../../src/context/virtual-drive/contents/application/ContentsDownloader';
import { temporalFolderProvider } from '../../../../../src/context/virtual-drive/contents/application/temporalFolderProvider';
import { FileDownloadEvents } from '../../../../../src/context/virtual-drive/contents/domain/contentHandlers/ContentFileDownloader';
import { FileMother } from '../../files/domain/FileMother';
import { EventBusMock } from '../../shared/__mock__/EventBusMock';
import { IpcRendererSyncEngineMock } from '../../shared/__mock__/IpcRendererSyncEngineMock';
import { LocalFileWriterMock } from '../__mocks__/LocalFileWriterMock';
import { ReadableHelloWorld } from '../__mocks__/ReadableHelloWorld';
import { RemoteFileContentsManagersFactoryMock } from '../__mocks__/RemoteFileContentsManagersFactoryMock';

describe.skip('Contents Downloader', () => {
  let localWriter: LocalFileWriterMock;
  let factory: RemoteFileContentsManagersFactoryMock;
  let ipc: IpcRendererSyncEngineMock;
  let eventBus: EventBusMock;

  let SUT: ContentsDownloader;

  beforeEach(() => {
    factory = new RemoteFileContentsManagersFactoryMock();
    localWriter = new LocalFileWriterMock();
    ipc = new IpcRendererSyncEngineMock();
    eventBus = new EventBusMock();

    SUT = new ContentsDownloader(
      factory,
      localWriter,
      ipc,
      temporalFolderProvider,
      eventBus
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
    factory.mockDownloader.mock.mockResolvedValueOnce(new ReadableHelloWorld());

    const file = FileMother.any();
    await SUT.run(file, async () => {
      /* do nothing */
      return { finished: true, progress: 100 };
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
