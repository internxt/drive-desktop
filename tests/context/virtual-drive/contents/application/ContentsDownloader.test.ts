import { mockDeep } from 'vitest-mock-extended';
import { ContentsDownloader } from '../../../../../src/context/virtual-drive/contents/application/ContentsDownloader';
import { temporalFolderProvider } from '../../../../../src/context/virtual-drive/contents/application/temporalFolderProvider';
import { FileDownloadEvents } from '../../../../../src/context/virtual-drive/contents/domain/contentHandlers/ContentFileDownloader';
import { FileMother } from '../../files/domain/FileMother';
import { ReadableHelloWorld } from '../__mocks__/ReadableHelloWorld';
import { LocalFileWriter } from '@/context/virtual-drive/contents/domain/LocalFileWriter';
import { ContentsManagersFactory } from '@/context/virtual-drive/contents/domain/ContentsManagersFactory';
import { SyncEngineIpc } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { EventBus } from '@/context/virtual-drive/shared/domain/EventBus';

describe.skip('Contents Downloader', () => {
  const localWriter = mockDeep<LocalFileWriter>();
  const factory = mockDeep<ContentsManagersFactory>();
  const ipc = mockDeep<SyncEngineIpc>();
  const eventBus = mockDeep<EventBus>();

  const SUT = new ContentsDownloader(factory, localWriter, ipc, temporalFolderProvider, eventBus);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each(['start', 'progress', 'finish', 'error'] satisfies Array<keyof FileDownloadEvents>)(
    'tracks all the manager events ',
    async (event: keyof FileDownloadEvents) => {
      factory.downloader.mockResolvedValueOnce(new ReadableHelloWorld());

      await SUT.run(FileMother.any());

      expect(factory.downloader).toBeCalledWith(event, expect.any(Function));
    }
  );

  it('writes the downloaded content a local file', async () => {
    factory.downloader.mockResolvedValueOnce(new ReadableHelloWorld());

    const file = FileMother.any();
    await SUT.run(file);

    expect(localWriter.write).toBeCalledWith(
      expect.objectContaining({
        name: file.name,
        extension: file.type,
        size: file.size,
      })
    );
  });
});
