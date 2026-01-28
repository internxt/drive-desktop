import { logger } from '@/backend/core/logger/logger';

import { cleanerStore } from '../stores/cleaner.store';

export function stopCleanup() {
  if (!cleanerStore.state.isCleanupInProgress) {
    logger.warn({ tag: 'CLEANER', msg: 'No cleanup process to stop' });
    return;
  }

  logger.debug({ tag: 'CLEANER', msg: 'Stopping cleanup process' });
  cleanerStore.state.currentAbortController.abort();
  cleanerStore.reset();
}
