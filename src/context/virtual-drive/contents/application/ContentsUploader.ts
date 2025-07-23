import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getUploadCallbacks } from '@/backend/features/local-sync/upload-file/upload-callbacks';
import { createReadStream, Stats } from 'fs';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

type Props = {
  path: string;
  stats: Stats;
};

export class ContentsUploader {
  constructor(
    private readonly remoteContentsManagersFactory: EnvironmentRemoteFileContentsManagersFactory,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
  ) {}

  async run({ path, stats }: Props) {
    const win32RelativePath = PlatformPathConverter.posixToWin(path);

    const absolutePath = this.relativePathToAbsoluteConverter.run(win32RelativePath) as AbsolutePath;

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

    if (error && error.code !== 'UNKNOWN') {
      ipcRendererSyncEngine.send('ADD_SYNC_ISSUE', {
        error: error.code,
        name: path,
      });
    }

    throw error;
  }
}
