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

export async function processItem(props: Props) {
  const { stats } = props.localItem;

  if (stats.isDirectory()) await processFolder(props);
  if (stats.isFile()) await processFile(props);
}

async function processFile({ ctx, localItem, state, remoteFilesMap }: Props) {
  const { path, stats } = localItem;

  const { data: fileInfo, error } = await NodeWin.getFileInfo({ path });

  if (fileInfo) {
    const { uuid, pinState } = fileInfo;
    const localFile = { ...localItem, uuid };

    if (isHydrationPending({ stats, pinState })) {
      state.hydrateFiles.push(localFile);
    } else if (isModified({ localFile, remoteFilesMap, pinState })) {
      state.modifiedFiles.push(localFile);
    }
  }

  if (error) {
    if (error.code === 'NOT_A_PLACEHOLDER') {
      state.createFiles.push(localItem);
    } else {
      ctx.logger.error({ msg: 'Error getting file info', path, error });
    }
  }
}

async function processFolder({ ctx, localItem, state }: Props) {
  const { path } = localItem;
  const { error } = await NodeWin.getFolderInfo({ ctx, path });

  if (error) {
    if (error.code === 'NOT_A_PLACEHOLDER') {
      state.createFolders.push(localItem);
    } else {
      ctx.logger.error({ msg: 'Error getting folder info', path, error });
    }
  }
}
