import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { read } from './read.service';
import * as handleReadCallbackModule from '../../../../features/fuse/on-read/handle-read-callback';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FirstsFileSearcher } from '../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { StorageFilesRepository } from '../../../../../context/storage/StorageFiles/domain/StorageFilesRepository';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { DownloadProgressTracker } from '../../../../../context/shared/domain/DownloadProgressTracker';
import * as getCredentialsModule from '../../../../../apps/main/auth/get-credentials';
import { DependencyInjectionUserProvider } from '../../../../../apps/shared/dependency-injection/DependencyInjectionUserProvider';
import * as buildNetworkClientModule from '../../../../../infra/environment/download-file/build-network-client';

const handleReadCallbackMock = partialSpyOn(handleReadCallbackModule, 'handleReadCallback');
const getCredentialsMock = partialSpyOn(getCredentialsModule, 'getCredentials');
const userProviderGetMock = partialSpyOn(DependencyInjectionUserProvider, 'get');
const buildNetworkClientMock = partialSpyOn(buildNetworkClientModule, 'buildNetworkClient');

describe('read', () => {
  let container: ReturnType<typeof mockDeep<Container>>;
  const fileSearcher = mockDeep<FirstsFileSearcher>();
  const temporalFinder = mockDeep<TemporalFileByPathFinder>();
  const repo = mockDeep<StorageFilesRepository>();
  const tracker = mockDeep<DownloadProgressTracker>();
  const network = {};

  beforeEach(() => {
    container = mockDeep<Container>();
    container.get.calledWith(FirstsFileSearcher).mockReturnValue(fileSearcher);
    container.get.calledWith(TemporalFileByPathFinder).mockReturnValue(temporalFinder);
    container.get.calledWith(StorageFilesRepository).mockReturnValue(repo);
    container.get.calledWith(DownloadProgressTracker).mockReturnValue(tracker);
    getCredentialsMock.mockReturnValue({ mnemonic: 'mnemonic' } as never);
    userProviderGetMock.mockReturnValue({
      bucket: 'bucket-id',
      bridgeUser: 'bridge-user',
      userId: 'user-id',
    } as never);
    buildNetworkClientMock.mockReturnValue(network as never);
  });

  describe('when handleReadCallback succeeds', () => {
    it('should return the buffer from handleReadCallback', async () => {
      const chunk = Buffer.from('file data');
      handleReadCallbackMock.mockResolvedValue({ data: chunk });

      const { data, error } = await read('/file.mp4', 10, 0, 'vlc', container);

      expect(error).toBeUndefined();
      expect(data).toBe(chunk);
    });

    it('should forward path, length, position and processName to handleReadCallback', async () => {
      handleReadCallbackMock.mockResolvedValue({ data: Buffer.alloc(0) });

      await read('/file.mp4', 32768, 4096, 'vlc', container);

      expect(handleReadCallbackMock).toHaveBeenCalledWith(
        expect.objectContaining({
          bucketId: 'bucket-id',
          mnemonic: 'mnemonic',
          network,
          path: '/file.mp4',
          range: {
            length: 32768,
            position: 4096,
          },
          processName: 'vlc',
        }),
      );
    });
  });

  describe('when handleReadCallback returns an error', () => {
    it('should propagate the error', async () => {
      handleReadCallbackMock.mockResolvedValue({ error: { code: FuseCodes.ENOENT } });

      const { data, error } = await read('/missing.mp4', 10, 0, 'vlc', container);

      expect(data).toBeUndefined();
      expect(error?.code).toBe(FuseCodes.ENOENT);
    });
  });

  describe('when an unexpected error is thrown', () => {
    it('should return EIO', async () => {
      handleReadCallbackMock.mockRejectedValue(new Error('unexpected'));

      const { data, error } = await read('/file.mp4', 10, 0, 'vlc', container);

      expect(data).toBeUndefined();
      expect(error?.code).toBe(FuseCodes.EIO);
    });
  });
});
