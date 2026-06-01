import { Container } from 'diod';
import { type Result } from '../../../../../context/shared/domain/Result';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FirstsFileSearcher } from '../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { StorageFilesRepository } from '../../../../../context/storage/StorageFiles/domain/StorageFilesRepository';
import { StorageFile } from '../../../../../context/storage/StorageFiles/domain/StorageFile';
import { DownloadProgressTracker } from '../../../../../context/shared/domain/DownloadProgressTracker';
import { handleReadCallback } from '../../../../features/fuse/on-read/handle-read-callback';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { getCredentials } from '../../../../../apps/main/auth/get-credentials';
import { DependencyInjectionUserProvider } from '../../../../../apps/shared/dependency-injection/DependencyInjectionUserProvider';
import { buildNetworkClient } from '../../../../../infra/environment/download-file/build-network-client';

export async function read(
  path: string,
  length: number,
  position: number,
  processName: string,
  container: Container,
): Promise<Result<Buffer, FuseError>> {
  try {
    const { mnemonic } = getCredentials();
    const user = DependencyInjectionUserProvider.get();
    const network = buildNetworkClient({ bridgeUser: user.bridgeUser, userId: user.userId });
    const repo = container.get(StorageFilesRepository);
    const tracker = container.get(DownloadProgressTracker);

    return await handleReadCallback({
      findVirtualFile: (p) => container.get(FirstsFileSearcher).run({ path: p }),
      findTemporalFile: (p) => container.get(TemporalFileByPathFinder).run(p),
      onDownloadProgress: (name, extension, bytesDownloaded, fileSize, elapsedTime) => {
        tracker.downloadUpdate(name, extension, {
          percentage: Math.min(bytesDownloaded / fileSize, 1),
          elapsedTime,
        });
      },
      saveToRepository: async (contentsId, size, uuid, name, extension) => {
        const storage = StorageFile.from({
          id: contentsId,
          virtualId: uuid,
          size,
        });
        await repo.register(storage);
        tracker.downloadFinished(name, extension);
      },
      bucketId: user.bucket,
      mnemonic,
      network,
      path,
      range: {
        length,
        position,
      },
      processName,
    });
  } catch (err) {
    logger.error({ msg: '[FUSE - Read] Unexpected error', error: err, path });
    return { error: new FuseError(FuseCodes.EIO, `[FUSE - Read] IO error: ${path}`) };
  }
}
