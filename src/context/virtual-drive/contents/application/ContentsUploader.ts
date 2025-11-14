import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getUploadCallbacks } from '@/backend/features/local-sync/upload-file/upload-callbacks';
import { Stats } from 'node:fs';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type Props = {
  ctx: ProcessSyncContext;
  path: RelativePath;
  absolutePath: AbsolutePath;
  stats: Stats;
};

export class ContentsUploader {
  static async run({ ctx, path, absolutePath, stats }: Props) {
    const { data: contentsId, error } = await ctx.fileUploader.run({
      absolutePath,
      size: stats.size,
      path,
      abortSignal: new AbortController().signal,
      callbacks: getUploadCallbacks({ path: absolutePath }),
    });

    if (contentsId) return { id: contentsId, size: stats.size };

    if (error && error.code === 'NOT_ENOUGH_SPACE') {
      ipcRendererSyncEngine.send('ADD_SYNC_ISSUE', {
        error: error.code,
        name: path,
      });
    }

    throw error;
  }
}
