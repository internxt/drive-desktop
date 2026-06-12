import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { Addon } from '@/node-win/addon-wrapper';
import { getSyncContextFromPath } from './get-sync-context-from-path';
import { ContextMenuSelection } from './types';

export async function resolveContextMenuItem(selectedPath: string): Promise<ContextMenuSelection | null> {
  try {
    const ctx = getSyncContextFromPath(selectedPath);
    if (!ctx) {
      logger.warn({ msg: 'No active sync context for context-menu path', selectedPath });
      return null;
    }
    // CfGetPlaceholderInfo reads Cloud Files metadata only; it does not hydrate
    // or open the selected file's contents.
    const { placeholderId, uuid } = await Addon.getPlaceholderState({
      path: selectedPath as AbsolutePath,
    });

    if (placeholderId.startsWith('FILE:')) {
      return { item: { type: 'file', uuid: uuid as FileUuid }, ctx };
    }

    if (placeholderId.startsWith('FOLDER:')) {
      return { item: { type: 'folder', uuid: uuid as FolderUuid }, ctx };
    }

    logger.warn({ msg: 'Unknown context-menu placeholder identity', selectedPath, placeholderId });
    return null;
  } catch (error) {
    logger.error({ msg: 'Error resolving context-menu item', selectedPath, error });
    return null;
  }
}
