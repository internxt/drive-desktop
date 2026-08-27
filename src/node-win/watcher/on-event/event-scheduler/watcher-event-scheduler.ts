import type { Watcher } from '../../../addon';
import { createSchedulerState } from './scheduler-state';
import type { PendingEvent, SchedulerOptions, SchedulerState, WatcherEventScheduler, WatcherSchedulerStats } from './types';

/**
 * Builds the watcher scheduler's public API.
 *
 * The scheduler is deliberately a small orchestrator: events enter through
 * `add`, settle through a per-item debounce, become ready in bounded batches,
 * and are dispatched by async.queue with bounded concurrency. The functions below implement
 * each phase against one explicit mutable SchedulerState.
 */
export function createWatcherEventScheduler(options: SchedulerOptions): WatcherEventScheduler {
  const state = createSchedulerState(options);

  return {
    add: (event) => addEvent(state, event),
    dispose: () => disposeScheduler(state),
    stats: () => getSchedulerStats(state),
  };
}

/** Stores the newest event for its item and schedules its debounce deadline. */
function addEvent(state: SchedulerState, event: Watcher.SuccessEvent) {
  if (state.disposed) return;

  state.received += 1;
  const entry = { internalId: event.internalId, version: ++state.version, readyAt: Date.now() + state.debounceMs };
  state.pendingEvents.upsert({ event, observedAtMs: event.observedAtMs }, entry);
  scheduleNextDebounceTimer(state);
}

/** Keeps one timer for the earliest valid debounce deadline. */
function scheduleNextDebounceTimer(state: SchedulerState) {
  if (state.disposed) return;

  const next = state.pendingEvents.nextPendingDeadline();
  if (!next) return clearDebounceTimer(state);

  const delay = next.readyAt - Date.now();
  if (delay <= 0) {
    clearDebounceTimer(state);
    if (hasWorkQueueCapacity(state)) schedulePromotion(state);
    return;
  }

  // During a bulk copy most incoming entries are later than the existing next deadline,
  // so avoid repeatedly cancelling and recreating the shared timer.
  if (state.timer && state.timerDueAt === next.readyAt) return;

  clearDebounceTimer(state);
  state.timer = setTimeout(() => {
    state.timer = undefined;
    state.timerDueAt = undefined;
    schedulePromotion(state);
  }, delay);
  state.timerDueAt = next.readyAt;
}

function clearDebounceTimer(state: SchedulerState) {
  if (state.timer) clearTimeout(state.timer);
  state.timer = undefined;
  state.timerDueAt = undefined;
}

/** Queues a later event-loop turn, giving Electron an opportunity to handle UI work. */
function schedulePromotion(state: SchedulerState) {
  if (state.disposed || state.promotionScheduled) return;

  state.promotionScheduled = true;
  setImmediate(() => {
    state.promotionScheduled = false;
    promoteDueEvents(state);
  });
}

/** Moves one bounded batch of settled events from the debounce schedule to async.queue. */
function promoteDueEvents(state: SchedulerState) {
  if (state.disposed) return;

  const now = Date.now();
  let promoted = 0;
  while (promoted < state.batchSize && hasWorkQueueCapacity(state)) {
    const pendingEvent = state.pendingEvents.takeNextDue(now);
    if (!pendingEvent) break;
    if (state.activeIds.has(pendingEvent.event.internalId)) continue;

    enqueueProcessing(state, pendingEvent);
    promoted += 1;
  }

  const next = state.pendingEvents.nextPendingDeadline();
  if (next && next.readyAt <= Date.now() && hasWorkQueueCapacity(state)) schedulePromotion(state);
  else scheduleNextDebounceTimer(state);
}

function hasWorkQueueCapacity(state: SchedulerState) {
  return state.workQueue.length() + state.workQueue.running() < state.maxReadyQueueSize;
}

function enqueueProcessing(state: SchedulerState, pendingEvent: PendingEvent) {
  pendingEvent.state = 'queued';
  void state.workQueue.push(() => processQueuedEvent(state, pendingEvent));
}

/** async.queue invokes this work only when its global concurrency has capacity. */
async function processQueuedEvent(state: SchedulerState, pendingEvent: PendingEvent) {
  if (state.disposed) return;

  const internalId = pendingEvent.event.internalId;
  const latest = state.pendingEvents.get(internalId);
  if (!latest || latest.version !== pendingEvent.version || pendingEvent.state !== 'queued') return;

  pendingEvent.state = 'active';
  state.activeIds.add(internalId);

  try {
    await state.dispatch({ event: pendingEvent.event, observedAtMs: pendingEvent.observedAtMs });
  } catch (error) {
    state.onError?.(error, pendingEvent.event);
  } finally {
    finishProcessing(state, pendingEvent);
  }
}

/** Releases the worker slot and schedules a newer event for the same item, if one arrived. */
function finishProcessing(state: SchedulerState, pendingEvent: PendingEvent) {
  const internalId = pendingEvent.event.internalId;
  state.activeIds.delete(internalId);

  const latest = state.pendingEvents.get(internalId);
  if (latest?.version === pendingEvent.version) {
    state.pendingEvents.delete(internalId);
  } else if (latest?.state === 'pending' && latest.readyAt <= Date.now()) {
    enqueueProcessing(state, latest);
  }

  scheduleNextDebounceTimer(state);
}

function disposeScheduler(state: SchedulerState) {
  state.disposed = true;
  clearDebounceTimer(state);
  state.pendingEvents.clear();
  state.workQueue.kill();
}

function getSchedulerStats(state: SchedulerState): WatcherSchedulerStats {
  return {
    received: state.received,
    coalesced: state.pendingEvents.size,
    queuedWork: state.workQueue.length(),
    active: state.activeIds.size,
    timerScheduled: state.timer !== undefined,
  };
}
