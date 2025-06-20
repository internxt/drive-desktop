import { ItemsToTrashEvent } from '@/apps/main/notification-schema';
import { logger } from '@/apps/shared/logger/logger';
import { splitItemsIntoFilesAndFolders } from '@/backend/features/remote-notifications/in/split-items-into-files-and-folders';
import { updateDatabaseStatusToTrashed } from '@/backend/features/remote-notifications/in/update-database-status-to-trashed';

export const markItemsAsTrashed = async ({ items }: { items: ItemsToTrashEvent['payload'] }) => {
  try {
    const { files, folders } = splitItemsIntoFilesAndFolders({ items });
    await updateDatabaseStatusToTrashed(files, folders);
    return { data: true };
  } catch (error) {
    return {
      error: logger.error({
        msg: 'Error while handling ITEMS_TO_TRASH event',
        error,
      }),
    };
  }
};
