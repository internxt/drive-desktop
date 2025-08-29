import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { trackAddFileEvent, isMoveFileEvent, store } from './is-move-event';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as sleep from '@/apps/main/util';

describe('is-move-event', () => {
  partialSpyOn(sleep, 'sleep');
  const setSpy = vi.spyOn(store.addFileEvents, 'set');
  const deleteSpy = vi.spyOn(store.addFileEvents, 'delete');

  const uuid = 'uuid' as FileUuid;

  beforeEach(() => {
    vi.useFakeTimers();
    store.addFileEvents.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should add and remove event after 10 seconds', () => {
    // When
    trackAddFileEvent({ uuid });
    // Then
    expect(setSpy).toBeCalledTimes(1);
    expect(store.addFileEvents.has(uuid)).toBe(true);
    // When
    vi.advanceTimersByTime(10_000);
    // Then
    expect(store.addFileEvents.has(uuid)).toBe(false);
    expect(deleteSpy).toBeCalledTimes(1);
  });

  it('should clear timeout if add event exists', () => {
    // When
    trackAddFileEvent({ uuid });
    trackAddFileEvent({ uuid });
    // Then
    expect(setSpy).toBeCalledTimes(2);
    expect(store.addFileEvents.has(uuid)).toBe(true);
    // When
    vi.advanceTimersByTime(10_000);
    // Then
    expect(store.addFileEvents.has(uuid)).toBe(false);
    expect(deleteSpy).toBeCalledTimes(1);
  });

  it('should return true if add event exists', async () => {
    // Given
    store.addFileEvents.set(uuid, {} as NodeJS.Timeout);
    // When
    const isMove = await isMoveFileEvent({ uuid });
    // Then
    expect(isMove).toBe(true);
  });

  it('should return false if add event does not exists', async () => {
    // When
    const isMove = await isMoveFileEvent({ uuid });
    // Then
    expect(isMove).toBe(false);
    expect(deleteSpy).toBeCalledTimes(0);
  });

  it('should return true if two consequent move events', async () => {
    // Given
    store.addFileEvents.set(uuid, {} as NodeJS.Timeout);
    // When
    const isMove1 = await isMoveFileEvent({ uuid });
    const isMove2 = await isMoveFileEvent({ uuid });
    // Then
    expect(isMove1).toBe(true);
    expect(isMove2).toBe(true);
  });
});
