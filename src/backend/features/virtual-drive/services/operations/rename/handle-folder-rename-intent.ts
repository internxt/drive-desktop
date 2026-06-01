import { Container } from 'diod';
import { SingleFolderMatchingSearcher } from '../../../../../../context/virtual-drive/folders/application/SingleFolderMatchingSearcher';
import { FolderStatuses } from '../../../../../../context/virtual-drive/folders/domain/FolderStatus';
import { FuseError, FuseNoSuchFileOrDirectoryError } from '../../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { Result } from '../../../../../../context/shared/domain/Result';
import { trashFolder } from './trash-folder';
import { moveFolder } from './move-folder';

type Props = {
  src: string;
  dest: string;
  container: Container;
};

export async function handleFolderRenameIntent({ src, dest, container }: Props): Promise<Result<void, FuseError>> {
  const folder = await container.get(SingleFolderMatchingSearcher).run({
    path: src,
    status: FolderStatuses.EXISTS,
  });

  if (!folder) return { error: new FuseNoSuchFileOrDirectoryError(src) };
  if (dest.startsWith('/.Trash')) return trashFolder({ folder, container });

  return moveFolder({ folder, src, dest, container });
}
