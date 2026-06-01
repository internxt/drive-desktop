import { FolderDeleter } from '../../../../context/virtual-drive/folders/application/FolderDeleter';
import { SingleFolderMatchingFinder } from '../../../../context/virtual-drive/folders/application/SingleFolderMatchingFinder';
import { FolderMother } from '../../../../context/virtual-drive/folders/domain/__test-helpers__/FolderMother';
import { FolderStatuses } from '../../../../context/virtual-drive/folders/domain/FolderStatus';
import { SyncFolderMessenger } from '../../../../context/virtual-drive/folders/domain/SyncFolderMessenger';
import { ContainerMock } from '../../__mocks__/ContainerMock';
import { TrashFolderCallback } from './TrashFolderCallback';

describe('TrashFolderCallback', () => {
  it('returns success even when folder deletion exceeds callback timeout', async () => {
    vi.useFakeTimers();

    try {
      const container = new ContainerMock();
      const folder = FolderMother.any();

      const folderFinder = {
        run: vi.fn(async () => {
          return folder;
        }),
      } as unknown as SingleFolderMatchingFinder;

      const folderDeleter = {
        run: vi.fn(() => {
          return new Promise<void>((resolve) => {
            setTimeout(resolve, 5_000);
          });
        }),
      } as unknown as FolderDeleter;

      container.set(SingleFolderMatchingFinder, folderFinder);
      container.set(FolderDeleter, folderDeleter);

      const callback = new TrashFolderCallback(container as never);
      const resultPromise = callback.execute('/Files/SlowFolder');

      await vi.advanceTimersByTimeAsync(1_600);

      const result = await resultPromise;

      expect(result.isRight()).toBe(true);
      expect(folderFinder.run).toHaveBeenCalledWith({
        path: '/Files/SlowFolder',
        status: FolderStatuses.EXISTS,
      });
      expect(folderDeleter.run).toHaveBeenCalledWith(folder.uuid);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports issue when background deletion fails after timeout', async () => {
    vi.useFakeTimers();

    try {
      const container = new ContainerMock();
      const folder = FolderMother.any();

      const folderFinder = {
        run: vi.fn(async () => {
          return folder;
        }),
      } as unknown as SingleFolderMatchingFinder;

      const folderDeleter = {
        run: vi.fn(() => {
          return new Promise<void>((_resolve, reject) => {
            setTimeout(() => {
              reject(new Error('slow-delete-failed'));
            }, 5_000);
          });
        }),
      } as unknown as FolderDeleter;

      const syncFolderMessenger = {
        issue: vi.fn(async () => undefined),
      } as unknown as SyncFolderMessenger;

      container.set(SingleFolderMatchingFinder, folderFinder);
      container.set(FolderDeleter, folderDeleter);
      container.set(SyncFolderMessenger, syncFolderMessenger);

      const callback = new TrashFolderCallback(container as never);
      const resultPromise = callback.execute('/Files/SlowFolder');

      await vi.advanceTimersByTimeAsync(1_600);

      const result = await resultPromise;
      expect(result.isRight()).toBe(true);

      await vi.advanceTimersByTimeAsync(3_500);
      await Promise.resolve();

      expect(syncFolderMessenger.issue).toHaveBeenCalledWith({
        error: 'FOLDER_TRASH_ERROR',
        cause: 'UNKNOWN',
        name: 'SlowFolder',
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
