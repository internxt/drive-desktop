import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { type Result } from '../../../../../context/shared/domain/Result';
import { FuseError, FuseIOError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFileUploader } from '../../../../../context/storage/TemporalFiles/application/upload/TemporalFileUploader';
import { TemporalFileDeleter } from '../../../../../context/storage/TemporalFiles/application/deletion/TemporalFileDeleter';
import { FirstsFileSearcher } from '../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { FileStatuses } from '../../../../../context/virtual-drive/files/domain/FileStatus';

type Props = {
  path: string;
  processName: string;
  container: Container;
};

// v.2.6.0
// Esteban Galvis Triana
// For files with unusual extensions or when the system has to figure
// out which app to use to open them—two file descriptors end up being created:
// one for metadata and one for the actual content.
// The issue is that when each descriptor closes, it triggers a release,
// resulting in a duplicate request to create the file remotely.
const uploadsInProgress = new Set<string>();

export async function release({ path, processName, container }: Props): Promise<Result<void, FuseError>> {
  try {
    const temporalFile = await container.get(TemporalFileByPathFinder).run(path);

    if (!temporalFile) {
      logger.debug({ msg: '[Release] No temporal file found, nothing to upload', path, processName });
      return { data: undefined };
    }

    if (temporalFile.isAuxiliary()) {
      logger.debug({ msg: '[Release] Auxiliary file detected, deleting without upload', path, processName });
      await container.get(TemporalFileDeleter).run(path);
      return { data: undefined };
    }

    if (uploadsInProgress.has(path)) {
      logger.debug({ msg: '[Release] Upload already in progress, skipping duplicate release', path, processName });
      return { data: undefined };
    }
    uploadsInProgress.add(path);

    try {
      const existingFile = await container.get(FirstsFileSearcher).run({ path, status: FileStatuses.EXISTS });
      const replaces = existingFile
        ? { contentsId: existingFile.contentsId, name: existingFile.name, extension: existingFile.type }
        : undefined;

      await container.get(TemporalFileUploader).run(temporalFile, replaces);
      logger.debug({ msg: '[Release] Temporal file uploaded', path, processName });
      return { data: undefined };
    } catch (uploadError) {
      logger.error({ msg: '[Release] Upload failed, deleting temporal file', error: uploadError, path, processName });
      await container.get(TemporalFileDeleter).run(path);
      return { error: new FuseIOError('Upload failed due to insufficient storage or network issues.') };
    } finally {
      uploadsInProgress.delete(path);
    }
  } catch (err: unknown) {
    logger.error({ msg: '[Release] Unexpected error', error: err, path, processName });
    return { error: new FuseIOError('An unexpected error occurred during file release.') };
  }
}
