import { NodeWin } from '@/infra/node-win/node-win.module';
import { ProcessSyncContext } from '../config';
import { SyncWalkItem } from '@/infra/file-system/services/sync-walk';
import { isHydrationPending } from './is-hydration-pending';
import { isModified } from './is-modified';
import { FileExplorerState, RemoteFilesMap } from './file-explorer-state.types';

type Props = {
  ctx: ProcessSyncContext;
  localItem: SyncWalkItem;
  state: FileExplorerState;
  remoteFilesMap: RemoteFilesMap;
};

export function processItem({ ctx, localItem, state, remoteFilesMap }: Props) {
  const { path, stats } = localItem;

  if (!stats) return;

  const pendingFileExplorerItem = { path, stats };

  if (stats.isDirectory()) {
    const { error } = NodeWin.getFolderInfo({ ctx, path });

    if (error && error.code === 'NON_EXISTS') {
      state.createFolders.push(pendingFileExplorerItem);
    }
  }

  if (stats.isFile()) {
    const { data: fileInfo, error } = NodeWin.getFileInfo({ ctx, path });

    if (fileInfo) {
      const { uuid, pinState } = fileInfo;
      const localFile = { ...pendingFileExplorerItem, uuid };

      if (isHydrationPending({ stats, pinState })) {
        state.hydrateFiles.push(localFile);
      } else if (isModified({ localFile, remoteFilesMap, pinState })) {
        state.modifiedFiles.push(localFile);
      }
    }

    if (error && error.code === 'NON_EXISTS') {
      state.createFiles.push(pendingFileExplorerItem);
    }
  }
}
