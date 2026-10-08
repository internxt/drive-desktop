import { Heap } from 'heap-js';
import type { PendingEventEntry } from './constants';

/**
 * Tracks when each pending item debounce period ends.
 *
 * A min-heap keeps the earliest deadline available through `peek`
 * so the scheduler can maintain one timer for the next item without sorting or scanning every pending item.
 */
export function createDebounceSchedule(): Heap<PendingEventEntry> {
  return new Heap<PendingEventEntry>((left, right) => left.readyAt - right.readyAt);
}
