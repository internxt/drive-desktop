import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getUploadCallbacks } from '@/backend/features/local-sync/upload-file/upload-callbacks';
import { createReadStream, Stats } from 'fs';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

type Props = {
  path: RelativePath;
  absolutePath: AbsolutePath;
  stats: Stats;
};

export class ContentsUploader {
  constructor(private readonly remoteContentsManagersFactory: EnvironmentRemoteFileContentsManagersFactory) {}

  async run({ path, absolutePath, stats }: Props) {
    const uploader = this.remoteContentsManagersFactory.uploader();

    const readable = createReadStream(absolutePath);
    const { data: contentsId, error } = await uploader.run({
      readable,
      absolutePath,
      size: stats.size,
      path,
      abortSignal: new AbortController().signal,
      callbacks: getUploadCallbacks({ path: absolutePath }),
    });

    if (contentsId) return { id: contentsId, size: stats.size };

    if (error && error.code !== 'UNKNOWN' && error.code !== 'FILE_MODIFIED') {
      ipcRendererSyncEngine.send('ADD_SYNC_ISSUE', {
        error: error.code,
        name: path,
      });
    }

    throw error;
  }
}
