import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createParentFolder } from './create-folder';
import { Stats } from 'node:fs';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { Addon } from '@/node-win/addon-wrapper';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { FileCreator } from '@/context/virtual-drive/files/application/FileCreator';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  stats: Stats;
};

export async function createFile({ ctx, path, stats }: TProps) {
  try {
    const uuid = await FileCreator.run({ ctx, path, size: stats.size });
    await Addon.convertToPlaceholder({ path, placeholderId: `FILE:${uuid}` });
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      await createParentFolder({ ctx, path });
      await createFile({ ctx, path, stats });
    } else {
      ipcRendererSyncEngine.send('FILE_UPLOAD_ERROR', { path });
      ctx.logger.error({
        msg: 'Error creating file',
        path,
        error,
      });
    }
  }
}
