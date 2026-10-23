export const DEBOUNCE_MS = process.env.NODE_ENV === 'test' ? 50 : 2000;

/**
 * These deliberately favour keeping Electron's main process responsive over
 * starting every watcher callback at once. They should be benchmarked against
 * the 250k-item reproduction before being increased.
 */
export const WATCHER_PROCESS_CONCURRENCY = 4;
export const WATCHER_DRAIN_BATCH_SIZE = 32;

/**
 * An item waiting for its debounce period to finish.
 *
 * This deliberately contains only scheduling information. The scheduler keeps
 * the full, latest watcher event in its Map; this entry only says when that
 * item should next be considered for processing.
 */
export type PendingEventEntry = {
  internalId: number;
  readyAt: number;
  version: number;
};
