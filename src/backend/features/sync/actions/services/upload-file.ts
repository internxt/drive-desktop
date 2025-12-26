import { addSyncIssue } from '@/apps/main/background-processes/issues';
import { CommonContext } from '@/apps/sync-engine/config';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { AbsolutePath, SyncModule } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  ctx: CommonContext;
  path: AbsolutePath;
  size: number;
};

export async function uploadFile({ ctx, path, size }: Props) {
  if (size === 0) {
    ctx.logger.warn({ msg: 'File is empty', path });
    return;
  }

  if (size > SyncModule.MAX_FILE_SIZE) {
    ctx.logger.warn({ msg: 'File size is too big', path, size });
    addSyncIssue({ error: 'FILE_SIZE_TOO_BIG', name: path });
    return;
  }

  return await EnvironmentFileUploader.run({ ctx, size, path });
}
