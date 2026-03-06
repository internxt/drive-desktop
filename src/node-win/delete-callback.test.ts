import { call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { deleteCallback, timeouts } from './delete-callback';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as onUnlink from '@/backend/features/local-sync/watcher/events/unlink/on-unlink';
import { toWin32Path } from './addon-wrapper';
import { workers } from '@/apps/main/remote-sync/store';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('delete-callback', () => {
  const onUnlinkMock = partialSpyOn(onUnlink, 'onUnlink');

  const connectionKey = 1n;
  const win32Path = toWin32Path(abs('/file.txt'));
  const isDirectory = false;
  const props = [connectionKey, win32Path, isDirectory] as const;

  workers.set('', { connectionKey } as any);

  beforeEach(() => {
    vi.useFakeTimers();
    timeouts.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not call it until 1s', () => {
    // When
    deleteCallback(...props);
    // Then
    vi.advanceTimersByTime(999);
    expect(onUnlinkMock).toBeCalledTimes(0);
    expect(timeouts.has(win32Path)).toBe(true);
  });

  it('should call it after 1s', () => {
    // When
    deleteCallback(...props);
    // Then
    vi.advanceTimersByTime(1000);
    expect(onUnlinkMock).toBeCalledTimes(1);
    expect(timeouts.size).toBe(0);
  });

  it('should call just once if key is the same', () => {
    // When
    deleteCallback(...props);
    deleteCallback(...props);
    // Then
    vi.advanceTimersByTime(1000);
    expect(onUnlinkMock).toBeCalledTimes(1);
    expect(timeouts.size).toBe(0);
  });

  it('should call just twice if key is different', () => {
    // When
    deleteCallback(...props);
    deleteCallback(connectionKey, toWin32Path(abs('/another.txt')), isDirectory);
    // Then
    vi.advanceTimersByTime(2000);
    expect(onUnlinkMock).toBeCalledTimes(2);
    expect(timeouts.size).toBe(0);
  });

  it('should log error if cannot find context', () => {
    // When
    deleteCallback(2n, win32Path, isDirectory);
    // Then
    vi.advanceTimersByTime(1000);
    expect(onUnlinkMock).toBeCalledTimes(0);
    expect(timeouts.size).toBe(0);
    call(loggerMock.error).toMatchObject({ msg: 'Cannot obtain context in delete callback' });
  });
});
