import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createParentFolder } from './create-folder';
import { FileCreationOrchestrator } from '@/context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { Stats } from 'node:fs';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { Addon } from '@/node-win/addon-wrapper';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  stats: Stats;
};

export async function createFile({ ctx, path, stats }: TProps) {
  try {
    const uuid = await FileCreationOrchestrator.run({ ctx, path, stats });
    await Addon.convertToPlaceholder({ path, placeholderId: `FILE:${uuid}` });
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      await createParentFolder({ ctx, path });
      await createFile({ ctx, path, stats });
    } else {
      ctx.logger.error({
        msg: 'Error creating file',
        path,
        error,
      });
    }
  }
}
