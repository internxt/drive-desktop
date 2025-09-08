import { Traverser, Tree } from '@/context/virtual-drive/items/application/Traverser';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { DangledFilesManager, PushAndCleanInput } from '@/context/virtual-drive/shared/domain/DangledFilesManager';
import { ipcRenderer } from 'electron';
import { ProcessSyncContext } from './config';
import { ProcessContainer } from './build-process-container';

async function load({ ctx, container, tree }: { ctx: ProcessSyncContext; container: ProcessContainer; tree: Tree }): Promise<void> {
  const addFilePromises = tree.files.map((file) => container.fileRepository.add(file));
  await Promise.all([addFilePromises]);
  logger.debug({ msg: 'In memory repositories loaded', workspaceId: ctx.workspaceId });
}

export async function runDangledFiles({ ctx, container }: { ctx: ProcessSyncContext; container: ProcessContainer }): Promise<void> {
  const workspaceId = ctx.workspaceId;

  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'Polling',
    workspaceId,
  });

  try {
    const tree = await Traverser.run({ ctx });
    await load({ ctx, container, tree });
    await container.fileDangledManager.run({ ctx });
  } catch (error) {
    logger.error({ msg: '[SYNC ENGINE] Polling error', workspaceId, error });
  }

  logger.debug({ msg: '[SYNC ENGINE] Polling finished', workspaceId });

  void DangledFilesManager.getInstance().pushAndClean(async (input: PushAndCleanInput) => {
    await ipcRenderer.invoke('UPDATE_FIXED_FILES', {
      toUpdate: input.toUpdateContentsIds,
      toDelete: input.toDeleteContentsIds,
    });
  });
}
