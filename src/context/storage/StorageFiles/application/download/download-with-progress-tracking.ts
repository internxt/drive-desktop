import { DownloadProgressTracker } from '../../../../shared/domain/DownloadProgressTracker';
import { StorageFileDownloader } from '../../application/download/StorageFileDownloader/StorageFileDownloader';
import { StorageFilesRepository } from '../../domain/StorageFilesRepository';
import { File } from '../../../../../context/virtual-drive/files/domain/File';
import { StorageFile } from '../../domain/StorageFile';

type Props = {
  virtualFile: File;
  tracker: DownloadProgressTracker;
  downloader: StorageFileDownloader;
  repository: StorageFilesRepository;
};

export async function downloadWithProgressTracking({ virtualFile, tracker, downloader, repository }: Props) {
  const storage = StorageFile.from({
    id: virtualFile.contentsId,
    virtualId: virtualFile.uuid,
    size: virtualFile.size,
  });

  tracker.downloadStarted(virtualFile.name, virtualFile.type);
  const { stream, metadata, handler } = await downloader.run(storage, virtualFile);

  await repository.store(storage, stream, (bytesWritten) => {
    const percentage = Math.min(bytesWritten / virtualFile.size, 1);
    tracker.downloadUpdate(metadata.name, metadata.type, { percentage, elapsedTime: handler.elapsedTime() });
  });

  tracker.downloadFinished(metadata.name, metadata.type);

  return storage;
}
