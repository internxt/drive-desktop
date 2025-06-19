import { broadcastToWindows } from '@/apps/main/windows';
import { ItemsToTrashEvent, NOTIFICATION_SCHEMA, NotificationSchema } from '@/apps/main/notification-schema';
import { logger } from '@/apps/shared/logger/logger';
import { debouncedSynchronization } from '@/apps/main/remote-sync/handlers';
import { driveFilesCollection, driveFoldersCollection } from '@/apps/main/remote-sync/store';
import { In } from 'typeorm';

export const processWebSocketEvent = async (data: any) => {
  if (data.event === 'FOLDER_DELETED') {
    broadcastToWindows('refresh-backup', undefined);
  }
  const parsedEventData = await NOTIFICATION_SCHEMA.safeParseAsync(data);
  if (parsedEventData.success) {
    const { data } = await handleParsedNotificationEvent({ event: parsedEventData.data });
    if (data === false) return;
  }
  logger.info({ msg: 'Notification received', data });
  await debouncedSynchronization();
};

export const handleParsedNotificationEvent = async ({ event }: { event: NotificationSchema }) => {
  if (event.clientId === 'drive-desktop') {
    logger.debug({
      msg: 'Notification received',
      event: event.event,
      clientId: event.clientId,
      payload: event.payload,
    });
    return { data: true };
  }
  if (event.event === 'ITEMS_TO_TRASH') {
    return await markItemsAsTrashed({ items: event.payload });
  }
  return { data: false };
};

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

export const splitItemsIntoFilesAndFolders = ({ items }: { items: ItemsToTrashEvent['payload'] }) => {
  const files = items.filter((item): item is { type: 'file'; uuid: string } => item.type === 'file');
  const folders = items.filter((item): item is { type: 'folder'; uuid: string } => item.type === 'folder');
  return { files, folders };
};

export const updateDatabaseStatusToTrashed = async (
  files: Array<{ type: 'file'; uuid: string }>,
  folders: Array<{ type: 'folder'; uuid: string }>,
) => {
  await Promise.all([
    driveFilesCollection.updateInBatch({
      where: { uuid: In(files.map((file) => file.uuid)) },
      payload: { status: 'TRASHED' },
    }),
    driveFoldersCollection.updateInBatch({
      where: { uuid: In(folders.map((folder) => folder.uuid)) },
      payload: { status: 'TRASHED' },
    }),
  ]);
};
