import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { store, trackRefreshItemPlaceholders } from './track-refresh-item-placeholders';
import * as refreshItemPlaceholders from './refresh-item-placeholders';

describe('track-refresh-item-placeholders', () => {
  const refreshItemPlaceholdersMock = partialSpyOn(refreshItemPlaceholders, 'refreshItemPlaceholders');

  const props = mockProps<typeof trackRefreshItemPlaceholders>({});

  beforeEach(() => {
    store.running = false;
    store.queued = false;
  });

  it('should run if not running', async () => {
    // When
    await trackRefreshItemPlaceholders(props);
    // Then
    expect(refreshItemPlaceholdersMock).toBeCalledTimes(1);
    expect(store.running).toBe(false);
  });

  it('should enqueue if running', async () => {
    // Given
    store.running = true;
    // When
    await trackRefreshItemPlaceholders(props);
    // Then
    expect(refreshItemPlaceholdersMock).toBeCalledTimes(0);
    expect(store.running).toBe(true);
    expect(store.queued).toBe(true);
  });

  it('should run two times if queued', async () => {
    // Given
    store.queued = true;
    // When
    await trackRefreshItemPlaceholders(props);
    // Then
    expect(refreshItemPlaceholdersMock).toBeCalledTimes(2);
    expect(store.queued).toBe(false);
  });

  it('should set running at the beginning and enqueue if called two times', async () => {
    // Given
    refreshItemPlaceholdersMock.mockImplementationOnce(async () => {
      expect(store.running).toBe(true);
      await trackRefreshItemPlaceholders(props);
      expect(store.queued).toBe(true);
    });
    // When
    await trackRefreshItemPlaceholders(props);
    // Then
    expect(refreshItemPlaceholdersMock).toBeCalledTimes(2);
    expect(store.queued).toBe(false);
  });
});
