import { queue } from 'async';
import { DEBOUNCE_MS, WATCHER_DRAIN_BATCH_SIZE, WATCHER_PROCESS_CONCURRENCY } from '../constants';
import { createPendingEvents } from './pending-events';
import type { SchedulerOptions, SchedulerState } from './types';

export function createSchedulerState({
  dispatch,
  onError,
  debounceMs = DEBOUNCE_MS,
  concurrency = WATCHER_PROCESS_CONCURRENCY,
  batchSize = WATCHER_DRAIN_BATCH_SIZE,
}: SchedulerOptions): SchedulerState {
  return {
    dispatch,
    onError,
    debounceMs,
    concurrency,
    batchSize,
    maxReadyQueueSize: Math.max(concurrency, batchSize * concurrency),
    pendingEvents: createPendingEvents(),
    workQueue: queue(async (work) => await work(), concurrency),
    activeIds: new Set(),
    timer: undefined,
    timerDueAt: undefined,
    promotionScheduled: false,
    disposed: false,
    received: 0,
    version: 0,
  };
}
