import {
  handleParsedNotificationEvent,
  markItemsAsTrashed,
  processWebSocketEvent,
  splitItemsIntoFilesAndFolders,
  updateDatabaseStatusToTrashed,
} from './remote-notifications.service';
import { broadcastToWindows } from '@/apps/main/windows';
import { loggerMock } from '../../../../tests/vitest/mocks.helper.test';
import { debouncedSynchronization } from '@/apps/main/remote-sync/handlers';
import { deepMocked } from '../../../../tests/vitest/utils.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import { NotificationSchema } from '@/apps/main/notification-schema';
import { driveFilesCollection, driveFoldersCollection } from '@/apps/main/remote-sync/store';
import { beforeEach } from 'vitest';

vi.mock(import('@/apps/main/windows'));
vi.mock(import('@/apps/main/remote-sync/handlers'));
vi.mock(import('@/apps/main/remote-sync/store'));

describe('RemoteNotificationsService', () => {
  const debouncedSynchronizationMock = deepMocked(debouncedSynchronization);
  const driveFilesCollectionUpdateInBatchMock = deepMocked(driveFilesCollection.updateInBatch);
  const driveFoldersCollectionUpdateInBatchMock = deepMocked(driveFoldersCollection.updateInBatch);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processWebSocketEvent', () => {
    it('should trigger refresh-backup on FOLDER_DELETED event', async () => {
      await processWebSocketEvent({ event: 'FOLDER_DELETED' });
      expect(broadcastToWindows).toHaveBeenCalledWith('refresh-backup', undefined);
    });
    it('should call handleParsedNotificationEvent if schema is valid', async () => {
      const validEvent = {
        event: 'ITEMS_TO_TRASH',
        email: 'test@example.com',
        clientId: 'drive-desktop',
        userId: 'user1',
        payload: [{ type: 'file', uuid: 'abc' }],
      };

      await processWebSocketEvent(validEvent);
      expect(loggerMock.debug).toHaveBeenCalledWith({
        msg: 'Notification received',
        event: validEvent.event,
        clientId: validEvent.clientId,
        payload: validEvent.payload,
      });
    });
    it('should call debouncedSynchronization if schema is not valid', async () => {
      const validEvent = {
        event: 'ANY_OTHER_EVENT',
      };

      await processWebSocketEvent(validEvent);
      expect(loggerMock.debug).toHaveBeenCalledTimes(0);
      expect(loggerMock.info).toHaveBeenCalledWith({
        msg: 'Notification received',
        data: validEvent,
      });
      expect(debouncedSynchronizationMock).toHaveBeenCalledTimes(1);
    });
  });
  describe('handleParsedNotificationEvent', () => {
    it('should log debug message if clientId is drive-desktop', async () => {
      const event = mockDeep<NotificationSchema>({
        clientId: 'drive-desktop',
      });
      const { data } = await handleParsedNotificationEvent({ event });
      expect(loggerMock.debug).toHaveBeenCalledWith({
        msg: 'Notification received',
        event: event.event,
        clientId: event.clientId,
        payload: event.payload,
      });
      expect(data).toBe(true);
    });
    it('should not log debug message if clientId is not drive-desktop', async () => {
      const event = mockDeep<NotificationSchema>({
        clientId: 'drive-web',
      });
      await handleParsedNotificationEvent({ event });
      expect(loggerMock.debug).toHaveBeenCalledTimes(0);
    });
    it('should call markItemsAsTrashed if event is ITEMS_TO_TRASH', async () => {
      const event = mockDeep<NotificationSchema>({
        event: 'ITEMS_TO_TRASH',
        payload: [{ type: 'file', uuid: 'file1' }],
      });
      const { data } = await handleParsedNotificationEvent({ event });
      expect(data).toBe(true);
    });
    it('should ONLY log debug message if event is ITEMS_TO_TRASH and clientId is drive-desktop', async () => {
      const event = mockDeep<NotificationSchema>({
        event: 'ITEMS_TO_TRASH',
        clientId: 'drive-desktop',
        payload: [{ type: 'file', uuid: 'file1' }],
      });
      const { data } = await handleParsedNotificationEvent({ event });
      expect(loggerMock.debug).toHaveBeenCalledWith({
        msg: 'Notification received',
        event: event.event,
        clientId: event.clientId,
        payload: event.payload,
      });
      expect(data).toBe(true);
    });
  });
  describe('markItemsAsTrashed', () => {
    it('should update files and folders to TRASHED status', async () => {
      const items = [
        { type: 'file' as const, uuid: 'file-uuid' },
        { type: 'folder' as const, uuid: 'folder-uuid' },
      ];

      const result = await markItemsAsTrashed({ items });
      expect(result).toEqual({ data: true });
    });

    it('should log error and return error object on failure', async () => {
      const items = [
        { type: 'file' as const, uuid: 'file-uuid' },
        { type: 'folder' as const, uuid: 'folder-uuid' },
      ];
      loggerMock.error.mockReturnValue(new Error('Error while handling ITEMS_TO_TRASH event'));
      driveFoldersCollectionUpdateInBatchMock.mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const { error } = await markItemsAsTrashed({ items });
      expect(error).toBeDefined();
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Error while handling ITEMS_TO_TRASH event',
          error: expect.any(Error),
        }),
      );
    });
  });
  describe('splitItemsIntoFilesAndFolders', () => {
    it('should return files and folders separated', () => {
      const result = splitItemsIntoFilesAndFolders({
        items: [
          { type: 'file', uuid: 'fi1' },
          { type: 'folder', uuid: 'fo1' },
          { type: 'file', uuid: 'fi2' },
        ],
      });

      expect(result.files).toEqual([
        { type: 'file', uuid: 'fi1' },
        { type: 'file', uuid: 'fi2' },
      ]);
      expect(result.folders).toEqual([{ type: 'folder', uuid: 'fo1' }]);
    });

    it('should return empty arrays if items is empty', () => {
      const result = splitItemsIntoFilesAndFolders({ items: [] });
      expect(result.files).toEqual([]);
      expect(result.folders).toEqual([]);
    });
  });
  describe('updateDatabaseStatusToTrashed', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should update file and folder statuses to TRASHED', async () => {
      await updateDatabaseStatusToTrashed([{ type: 'file', uuid: 'f-1' }], [{ type: 'folder', uuid: 'd-1' }]);

      expect(driveFilesCollectionUpdateInBatchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { status: 'TRASHED' },
          where: {
            uuid: expect.any(Object),
          },
        }),
      );

      expect(driveFoldersCollectionUpdateInBatchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { status: 'TRASHED' },
          where: {
            uuid: expect.any(Object),
          },
        }),
      );
    });
    it('should handle empty arrays without error', async () => {
      await updateDatabaseStatusToTrashed([], []);
      expect(driveFilesCollectionUpdateInBatchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { status: 'TRASHED' },
          where: {
            uuid: expect.any(Object),
          },
        }),
      );

      expect(driveFoldersCollectionUpdateInBatchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { status: 'TRASHED' },
          where: {
            uuid: expect.any(Object),
          },
        }),
      );
    });
  });
});
