import { mockDeep } from 'vitest-mock-extended';
import { ContentsDownloader } from '../../../../../src/context/virtual-drive/contents/application/ContentsDownloader';
import {
  ContentFileDownloader,
  FileDownloadEvents,
} from '../../../../../src/context/virtual-drive/contents/domain/contentHandlers/ContentFileDownloader';
import { FileMother } from '../../files/domain/FileMother';
import { LocalFileWriter } from '@/context/virtual-drive/contents/domain/LocalFileWriter';
import { SyncEngineIpc } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { EventEmitter, Readable } from 'stream';
import { EnvironmentRemoteFileContentsManagersFactory } from '@/context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';

describe('Contents Downloader', () => {
  const temporalFolderProvider = async (): Promise<string> => {
    return await 'C:/temp';
  };

  const localWriter = mockDeep<LocalFileWriter>();
  const factory = mockDeep<EnvironmentRemoteFileContentsManagersFactory>();
  const ipc = mockDeep<SyncEngineIpc>();

  const environmentContentFileDownloader = mockDeep<ContentFileDownloader>();
  const eventEmitter = new EventEmitter();

  // Asignamos los métodos correctamente
  environmentContentFileDownloader.on.mockImplementation((event, handler) => {
    eventEmitter.on(event, handler);
  });
  environmentContentFileDownloader.download.mockResolvedValue(new Readable());
  environmentContentFileDownloader.forceStop.mockImplementation(() => {
    eventEmitter.emit('error', new Error('Download stopped'));
  });
  const callbackFunction = async (data: boolean, path: string) => {
    return await {
      finished: data,
      progress: path.length,
    };
  };

  const SUT = new ContentsDownloader(factory, localWriter, ipc, temporalFolderProvider);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each(['start', 'progress', 'finish', 'error'] satisfies Array<keyof FileDownloadEvents>)(
    'tracks all the manager events ',
    async (event: keyof FileDownloadEvents) => {
      factory.downloader.mockResolvedValueOnce(environmentContentFileDownloader);

      await SUT.run(FileMother.any(), callbackFunction);

      expect(environmentContentFileDownloader.on).toBeCalledWith(event, expect.any(Function));
    },
  );

  it('writes the downloaded content a local file', async () => {
    const file = FileMother.any();

    factory.downloader.mockResolvedValueOnce(environmentContentFileDownloader);

    await SUT.run(file, callbackFunction);

    expect(localWriter.write).toBeCalledWith(
      expect.objectContaining({
        name: file.name,
        extension: file.type,
        size: file.size,
      }),
    );
  });
});
