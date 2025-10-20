import { logger } from '@/apps/shared/logger/logger';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { ProcessSyncContext } from '../config';
import { processItem } from './process-item';
import { getExistingFiles } from '@/context/virtual-drive/items/application/RemoteItemsGenerator';
import { FileExplorerState } from './file-explorer-state.types';

type TProps = {
  ctx: ProcessSyncContext;
};

export async function getFileExplorerState({ ctx }: TProps) {
  const rootFolder = ctx.virtualDrive.syncRootPath;

  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Get file explorer state', rootFolder });

  const state: FileExplorerState = {
    createFiles: [],
    createFolders: [],
    hydrateFiles: [],
    modifiedFiles: [],
  };

  const remoteFiles = await getExistingFiles({ ctx });
  const remoteFilesMap = Object.fromEntries(remoteFiles.map((file) => [file.uuid, file]));

  const localItems = await fileSystem.syncWalk({ rootFolder });

  for (const localItem of localItems) {
    processItem({ ctx, localItem, state, remoteFilesMap });
  }

  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'File explorer state',
    createFiles: state.createFiles.map((file) => file.path),
    createFolders: state.createFolders.map((file) => file.path),
    hydrateFiles: state.hydrateFiles.map((file) => file.path),
    modifiedFiles: state.modifiedFiles.map((file) => file.path),
  });

  return state;
}
