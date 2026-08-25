import type { Watcher } from '../../../addon';
import type { PendingEventEntry } from '../constants';
import { createDebounceSchedule } from '../debounce-schedule';
import type { PendingEvent } from './types';

/**
 * Stores pending watcher events through two internal indexes:
 *
 * - by internalId, to retain the newest full event for an item;
 * - by readyAt, to find the next debounce deadline efficiently.
 *
 * Replacing an item appends a new heap entry. The older entry is harmless and
 * is removed only if it reaches the top and no longer matches the Map. This is
 * simpler than supporting arbitrary removal from the heap on every update.
 */
export function createPendingEvents() {
  const items = new Map<number, PendingEvent>();
  const deadlines = createDebounceSchedule();
  const nextPendingDeadline = () => {
    discardStaleDeadlines(items, deadlines);
    return deadlines.peek();
  };

  return {
    upsert(event: Watcher.SuccessEvent, entry: PendingEventEntry) {
      items.set(entry.internalId, { event, ...entry, state: 'pending' });
      deadlines.push(entry);
    },

    /** Returns the earliest deadline that still represents the current event. */
    nextPendingDeadline,

    /** Removes and returns the earliest current event only when it is due. */
    takeNextDue(now: number) {
      const next = nextPendingDeadline();
      if (!next || next.readyAt > now) return;

      deadlines.pop();
      return items.get(next.internalId);
    },

    get(internalId: number) {
      return items.get(internalId);
    },

    delete(internalId: number) {
      items.delete(internalId);
    },

    clear() {
      items.clear();
      deadlines.clear();
    },

    get size() {
      return items.size;
    },
  };
}

function discardStaleDeadlines(items: Map<number, PendingEvent>, deadlines: ReturnType<typeof createDebounceSchedule>) {
  let next = deadlines.peek();
  while (next && !isCurrentPendingEntry(items, next)) {
    deadlines.pop();
    next = deadlines.peek();
  }
}

function isCurrentPendingEntry(items: Map<number, PendingEvent>, entry: PendingEventEntry) {
  const item = items.get(entry.internalId);
  return item?.version === entry.version && item.state === 'pending';
}
