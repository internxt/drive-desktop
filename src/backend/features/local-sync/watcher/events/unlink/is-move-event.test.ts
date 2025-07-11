import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { trackAddDirEvent, trackAddEvent, isMoveDirEvent, isMoveEvent, store } from './is-move-event';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as sleep from '@/apps/main/util';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('is-move-event', () => {
  const addSpy = vi.spyOn(store.addEvents, 'add');
  const deleteSpy = vi.spyOn(store.addEvents, 'delete');
  const addDirSpy = vi.spyOn(store.addDirEvents, 'add');
  const deleteDirSpy = vi.spyOn(store.addDirEvents, 'delete');
  const sleepMock = partialSpyOn(sleep, 'sleep');

  beforeEach(() => {
    vi.clearAllMocks();

    sleepMock.mockImplementation(() => Promise.resolve());

    store.addEvents.clear();
    store.addDirEvents.clear();
  });

  describe('what should happen for files', () => {
    const uuid = 'uuid' as FileUuid;

    it('should add and remove event when call addEvent', async () => {
      // Given
      sleepMock.mockImplementation(() => {
        expect(store.addEvents.has(uuid)).toBe(true);
        return Promise.resolve();
      });
      // When
      await trackAddEvent({ uuid });
      // Then
      expect(addSpy).toBeCalledTimes(1);
      expect(addSpy).toBeCalledWith(uuid);
      expect(deleteSpy).toBeCalledTimes(1);
      expect(deleteSpy).toBeCalledWith(uuid);
      expect(store.addEvents.has(uuid)).toBe(false);
    });

    it('should return true if add event exists', async () => {
      // Given
      store.addEvents.add(uuid);
      // When
      const isMove = await isMoveEvent({ uuid });
      // Then
      expect(isMove).toBe(true);
    });

    it('should return false if add event does not exists', async () => {
      // When
      const isMove = await isMoveEvent({ uuid });
      // Then
      expect(isMove).toBe(false);
    });
  });

  describe('what should happen for folders', () => {
    const uuid = 'uuid' as FolderUuid;

    it('should add and remove event when call addEvent', async () => {
      // Given
      sleepMock.mockImplementation(() => {
        expect(store.addDirEvents.has(uuid)).toBe(true);
        return Promise.resolve();
      });
      // When
      await trackAddDirEvent({ uuid });
      // Then
      expect(addDirSpy).toBeCalledTimes(1);
      expect(addDirSpy).toBeCalledWith(uuid);
      expect(deleteDirSpy).toBeCalledTimes(1);
      expect(deleteDirSpy).toBeCalledWith(uuid);
      expect(store.addDirEvents.has(uuid)).toBe(false);
    });

    it('should return true if add event exists', async () => {
      // Given
      store.addDirEvents.add(uuid);
      // When
      const isMove = await isMoveDirEvent({ uuid });
      // Then
      expect(isMove).toBe(true);
    });

    it('should return false if add event does not exists', async () => {
      // When
      const isMove = await isMoveDirEvent({ uuid });
      // Then
      expect(isMove).toBe(false);
    });
  });
});
