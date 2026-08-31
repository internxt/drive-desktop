import { describe, expect, it } from 'vitest';
import type { PendingEventEntry } from './constants';
import { createDebounceSchedule } from './debounce-schedule';

const entry = (readyAt: number): PendingEventEntry => ({ internalId: readyAt, readyAt, version: 1 });

describe('debounce schedule', () => {
  it('always exposes and takes the next deadline first', () => {
    const schedule = createDebounceSchedule();
    [30, 10, 20, 5].forEach((readyAt) => schedule.push(entry(readyAt)));

    expect(schedule.peek()?.readyAt).toBe(5);
    expect([schedule.pop(), schedule.pop(), schedule.pop(), schedule.pop()].map((item) => item?.readyAt)).toEqual([5, 10, 20, 30]);
  });

  it('has no next deadline when empty', () => {
    const schedule = createDebounceSchedule();

    expect(schedule.peek()).toBeUndefined();
    expect(schedule.pop()).toBeUndefined();
  });
});
