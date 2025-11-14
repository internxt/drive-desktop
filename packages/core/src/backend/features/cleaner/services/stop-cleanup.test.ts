import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';

import { cleanerStore } from '../stores/cleaner.store';
import { stopCleanup } from './stop-cleanup';

describe('stopCleanup', () => {
  beforeEach(() => {
    cleanerStore.reset();
  });

  it('should stop running cleanup process', () => {
    // Given
    cleanerStore.state.isCleanupInProgress = true;
    const abortController = cleanerStore.state.currentAbortController;
    // When
    stopCleanup();
    // Then
    expect(abortController.signal.aborted).toBe(true);
    call(loggerMock.debug).toMatchObject({
      msg: 'Stopping cleanup process',
    });
    expect(cleanerStore.state.isCleanupInProgress).toBe(false);
  });

  it('should handle stop when no cleanup is running', () => {
    // When
    stopCleanup();
    // Then
    call(loggerMock.warn).toMatchObject({
      msg: 'No cleanup process to stop',
    });
  });
});
