import type { Watcher } from '../../../addon';
import type { QueueObject } from 'async';
import type { createPendingEvents } from './pending-events';

export type Dispatch = (event: Watcher.SuccessEvent) => Promise<void>;
export type ScheduledWork = () => Promise<void>;

export type PendingEvent = {
  event: Watcher.SuccessEvent;
  readyAt: number;
  version: number;
  state: 'pending' | 'queued' | 'active';
};

export type WatcherSchedulerStats = {
  received: number;
  coalesced: number;
  /** Work accepted by async.queue but not yet executing. */
  queuedWork: number;
  active: number;
  timerScheduled: boolean;
};

export type WatcherEventScheduler = {
  add(event: Watcher.SuccessEvent): void;
  dispose(): void;
  stats(): WatcherSchedulerStats;
};

/**
 * Mutable state for one Sync root watcher scheduler.
 *
 * `pendingEvents` retains the newest full event for each item and finds the
 * next valid debounce deadline. `activeIds` is separate because pendingEvents
 * may already contain a newer event for an item while an older version is still being dispatched.
 * It prevents those two versions from running concurrently.
 */
export type SchedulerState = {
  readonly dispatch: Dispatch;
  readonly onError?: (error: unknown, event: Watcher.SuccessEvent) => void;
  readonly debounceMs: number;
  readonly concurrency: number;
  readonly batchSize: number;
  readonly maxReadyQueueSize: number;
  /** Newest events and their debounce deadlines, indexed internally by ID and time. */
  readonly pendingEvents: ReturnType<typeof createPendingEvents>;
  /** Standard async worker queue; it owns global concurrency and queued work. */
  readonly workQueue: QueueObject<ScheduledWork>;
  /** IDs with an older event currently in flight. */
  readonly activeIds: Set<number>;
  timer: NodeJS.Timeout | undefined;
  timerDueAt: number | undefined;
  promotionScheduled: boolean;
  disposed: boolean;
  /** Observability only: total native events accepted by add(). */
  received: number;
  version: number;
};

export type SchedulerOptions = {
  dispatch: Dispatch;
  onError?: (error: unknown, event: Watcher.SuccessEvent) => void;
  debounceMs?: number;
  concurrency?: number;
  batchSize?: number;
};
