import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getUploadCallbacks } from '@/backend/features/local-sync/upload-file/upload-callbacks';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

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
      ipcRendererSyncEngine.send('ADD_SYNC_ISSUE', {
        error: error.code,
        name: path,
      });
    }

    throw error;
  }
}
