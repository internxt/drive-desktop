import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { addSyncIssue } from '@/apps/main/background-processes/issues';
import { getUploadCallbacks } from '@/apps/backups/process-files/upload-callbacks';

type Props = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  size: number;
};

export class ContentsUploader {
  static async run({ ctx, path, size }: Props) {
    const { data: contentsId, error } = await ctx.fileUploader.run({
      size,
      path,
      abortSignal: new AbortController().signal,
      callbacks: getUploadCallbacks({ path }),
    });

    if (contentsId) return contentsId;

    if (error && error.code === 'NOT_ENOUGH_SPACE') {
      addSyncIssue({ error: error.code, name: path });
    }

    throw error;
  }
}
