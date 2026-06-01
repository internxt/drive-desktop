import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { FirstsFileSearcher } from '../../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { FileStatuses } from '../../../../../../context/virtual-drive/files/domain/FileStatus';
import { TemporalFileByPathFinder } from '../../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { FuseError, FuseNoSuchFileOrDirectoryError } from '../../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { Result } from '../../../../../../context/shared/domain/Result';
import { uploadTemporalFileOnRename } from './upload-temporal-file-on-rename';

type Props = {
  src: string;
  dest: string;
  container: Container;
};

export async function handleTemporalFileUploadOnRename({
  src,
  dest,
  container,
}: Props): Promise<Result<void, FuseError>> {
  const fileToOverride = await container.get(FirstsFileSearcher).run({
    path: dest,
    status: FileStatuses.EXISTS,
  });

  if (!fileToOverride) {
    logger.debug({ msg: '[UPLOAD ON RENAME] file to override not found', dest });
    return { error: new FuseNoSuchFileOrDirectoryError(dest) };
  }

  const document = await container.get(TemporalFileByPathFinder).run(src);

  if (!document) {
    logger.debug({ msg: '[UPLOAD ON RENAME] offline file not found', src });
    return { error: new FuseNoSuchFileOrDirectoryError(src) };
  }

  return uploadTemporalFileOnRename({ virtual: fileToOverride, document, src, container });
}
