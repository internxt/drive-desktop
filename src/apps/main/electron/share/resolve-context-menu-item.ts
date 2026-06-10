import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { Addon } from '@/node-win/addon-wrapper';

export type ContextMenuItem = { type: 'file'; uuid: FileUuid } | { type: 'folder'; uuid: FolderUuid };

export async function resolveContextMenuItem(selectedPath: string): Promise<ContextMenuItem | null> {
  try {
    // CfGetPlaceholderInfo reads Cloud Files metadata only; it does not hydrate
    // or open the selected file's contents.
    const { placeholderId, uuid } = await Addon.getPlaceholderState({
      path: selectedPath as AbsolutePath,
    });

    if (placeholderId.startsWith('FILE:')) {
      return { type: 'file', uuid: uuid as FileUuid };
    }

    if (placeholderId.startsWith('FOLDER:')) {
      return { type: 'folder', uuid: uuid as FolderUuid };
    }

    logger.warn({ msg: 'Unknown context-menu placeholder identity', selectedPath, placeholderId });
    return null;
  } catch (error) {
    logger.error({ msg: 'Error resolving context-menu item', selectedPath, error });
    return null;
  }
}
