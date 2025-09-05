import { mockDeep } from 'vitest-mock-extended';
import { ContentsDownloader } from '../../../../../src/context/virtual-drive/contents/application/ContentsDownloader';
import { EventEmitter, Readable } from 'stream';
import { EnvironmentRemoteFileContentsManagersFactory } from '@/context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import {
  EnvironmentContentFileDownloader,
  FileDownloadEvents,
} from '@/context/virtual-drive/contents/infrastructure/download/EnvironmentContentFileDownloader';
import { FSLocalFileWriter } from '../infrastructure/FSLocalFileWriter';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as temporalFolderProvider from './temporalFolderProvider';

describe('Contents Downloader', () => {
  const temporalFolderProviderMock = partialSpyOn(temporalFolderProvider, 'temporalFolderProvider');
  const writeMock = partialSpyOn(FSLocalFileWriter, 'write');

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

  const SUT = new ContentsDownloader(factory);

  const props = mockProps<typeof SUT.run>({
    callback: callbackFunction,
    file: {
      nameWithExtension: 'file.txt',
      size: 1024,
    },
  });

  beforeEach(() => {
    temporalFolderProviderMock.mockResolvedValue('C:/temp');
  });

  it.each(['start', 'progress', 'finish', 'error'] satisfies Array<keyof FileDownloadEvents>)(
    'tracks all the manager events ',
    async (event: keyof FileDownloadEvents) => {
      factory.downloader.mockReturnValueOnce(environmentContentFileDownloader);

      await SUT.run(props);

      expect(environmentContentFileDownloader.on).toBeCalledWith(event, expect.any(Function));
    },
  );

  it('writes the downloaded content a local file', async () => {
    factory.downloader.mockReturnValueOnce(environmentContentFileDownloader);

    await SUT.run(props);

    expect(writeMock).toBeCalledWith(
      expect.objectContaining({
        file: {
          nameWithExtension: 'file.txt',
          size: 1024,
        },
      }),
    );
  });
});
