import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { clearStore, store } from '../store';
import { addItem } from './add-item';
import * as broadcastToFrontendModule from './broadcast-to-frontend';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('add-item', () => {
  const broadcastToFrontendMock = partialSpyOn(broadcastToFrontendModule, 'broadcastToFrontend');

  const props = mockProps<typeof addItem>({ key: 'uuid' as FileUuid });

  beforeEach(() => {
    vi.useFakeTimers();

    clearStore();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should add item to store and broadcast to frontend when add item', () => {
    // When
    addItem(props);
    // Then
    calls(broadcastToFrontendMock).toHaveLength(1);
    expect(store.items).toMatchObject({
      uuid: {
        key: 'uuid',
        time: expect.any(Number),
        timeout: expect.anything(),
      },
    });
  });

  it('should broadcast to frontend after one second', () => {
    // When
    addItem(props);
    vi.advanceTimersByTime(1000);
    // Then
    calls(broadcastToFrontendMock).toHaveLength(2);
  });

  it('should remove item after ten seconds', () => {
    // When
    addItem(props);
    vi.advanceTimersByTime(10000);
    // Then
    expect(store.items).toStrictEqual({});
  });

  it('should clear previous timeout when adding item with same key', () => {
    // Given
    addItem(props);
    // When
    vi.advanceTimersByTime(5000);
    addItem(props);
    vi.advanceTimersByTime(5000);
    // Then
    expect(store.items).toMatchObject({ uuid: { key: 'uuid' } });
    // When
    vi.advanceTimersByTime(5000);
    // Then
    expect(store.items).toStrictEqual({});
  });
});
