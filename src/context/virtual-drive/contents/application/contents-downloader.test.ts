import { mockDeep } from 'vitest-mock-extended';
import { ContentsDownloader } from '../../../../../src/context/virtual-drive/contents/application/ContentsDownloader';
import { EventEmitter, Readable } from 'stream';
import { EnvironmentRemoteFileContentsManagersFactory } from '@/context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import {
  EnvironmentContentFileDownloader,
  FileDownloadEvents,
} from '@/context/virtual-drive/contents/infrastructure/download/EnvironmentContentFileDownloader';
import { FileMother } from '@/tests/context/virtual-drive/files/domain/FileMother';
import { FSLocalFileWriter } from '../infrastructure/FSLocalFileWriter';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ContentsSize } from '../domain/ContentsSize';

describe('Contents Downloader', () => {
  const temporalFolderProvider = (): Promise<string> => {
    return Promise.resolve('C:/temp');
  };

  const localWriter = mockDeep<FSLocalFileWriter>();
  const factory = mockDeep<EnvironmentRemoteFileContentsManagersFactory>();

  const environmentContentFileDownloader = mockDeep<EnvironmentContentFileDownloader>();
  const eventEmitter = new EventEmitter();

  // Asignamos los métodos correctamente
  environmentContentFileDownloader.on.mockImplementation((event, handler) => {
    eventEmitter.on(event, handler);
  });
  environmentContentFileDownloader.download.mockResolvedValue(new Readable());
  environmentContentFileDownloader.forceStop.mockImplementation(() => {
    eventEmitter.emit('error', new Error('Download stopped'));
  });
  const callbackFunction = (data: boolean, path: string) => {
    return Promise.resolve({
      finished: data,
      progress: path.length,
    });
  };

  const SUT = new ContentsDownloader(factory, localWriter, temporalFolderProvider);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each(['start', 'progress', 'finish', 'error'] satisfies Array<keyof FileDownloadEvents>)(
    'tracks all the manager events ',
    async (event: keyof FileDownloadEvents) => {
      factory.downloader.mockResolvedValueOnce(environmentContentFileDownloader);

      await SUT.run(FileMother.any() as unknown as SimpleDriveFile, callbackFunction);

      expect(environmentContentFileDownloader.on).toBeCalledWith(event, expect.any(Function));
    },
  );

  it('writes the downloaded content a local file', async () => {
    const file = FileMother.any();

    factory.downloader.mockResolvedValueOnce(environmentContentFileDownloader);

    await SUT.run(file as unknown as SimpleDriveFile, callbackFunction);

    expect(localWriter.write).toBeCalledWith(
      expect.objectContaining({
        nameWithExtension: `${file.name}.${file.type}`,
        size: new ContentsSize(file.size),
      }),
    );
  });
});
