import { Container } from 'diod';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { Result } from '../../../../../context/shared/domain/Result';
import { handleFileRenameIntent } from './rename/handle-file-rename-intent';
import { handleFolderRenameIntent } from './rename/handle-folder-rename-intent';
import { handleTemporalFileUploadOnRename } from './rename/handle-temporal-file-upload-on-rename';

type Props = {
  src: string;
  dest: string;
  container: Container;
};

export async function rename({ src, dest, container }: Props): Promise<Result<void, FuseError>> {
  const { error: fileError } = await handleFileRenameIntent({ src, dest, container });
  if (!fileError) return { data: undefined };
  if (fileError.code !== FuseCodes.ENOENT) return { error: fileError };

  const { error: folderError } = await handleFolderRenameIntent({ src, dest, container });
  if (!folderError) return { data: undefined };
  if (folderError.code !== FuseCodes.ENOENT) return { error: folderError };

  const { error: uploadError } = await handleTemporalFileUploadOnRename({ src, dest, container });
  if (uploadError) return { error: uploadError };
  return { data: undefined };
}
