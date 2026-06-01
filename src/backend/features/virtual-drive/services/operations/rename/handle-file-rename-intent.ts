import { Container } from 'diod';
import { FirstsFileSearcher } from '../../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { TemporalFile } from '../../../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { FileStatuses } from '../../../../../../context/virtual-drive/files/domain/FileStatus';
import { FuseError, FuseNoSuchFileOrDirectoryError } from '../../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { Result } from '../../../../../../context/shared/domain/Result';
import { trashFile } from './trash-file';
import { moveFile } from './move-file';

type Props = {
  src: string;
  dest: string;
  container: Container;
};

export async function handleFileRenameIntent({ src, dest, container }: Props): Promise<Result<void, FuseError>> {
  const file = await container.get(FirstsFileSearcher).run({
    path: src,
    status: FileStatuses.EXISTS,
  });

  if (!file) return { error: new FuseNoSuchFileOrDirectoryError(src) };
  if (dest.startsWith('/.Trash')) return trashFile({ file, container });
  if (TemporalFile.isTemporaryPath(dest)) return { data: undefined };

  return moveFile({ file, src, dest, container });
}
