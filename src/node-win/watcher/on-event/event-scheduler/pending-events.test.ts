import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { describe, expect, it } from 'vitest';
import type { Watcher } from '../../../addon';
import { createPendingEvents } from './pending-events';

const event = (internalId: number, size: number): Watcher.SuccessEvent => ({
  action: 'update',
  type: 'file',
  path: `C:/Sync/${internalId}` as AbsolutePath,
  size,
  internalId,
  ctimeMs: 0,
  mtimeMs: 0,
});

describe('pending events', () => {
  it('keeps only the newest event and skips its older heap deadline', () => {
    const pendingEvents = createPendingEvents();
    pendingEvents.upsert(event(1, 1), { internalId: 1, version: 1, readyAt: 10 });
    pendingEvents.upsert(event(1, 2), { internalId: 1, version: 2, readyAt: 20 });

    expect(pendingEvents.nextPendingDeadline()).toMatchObject({ internalId: 1, version: 2, readyAt: 20 });
    expect(pendingEvents.get(1)?.event.size).toBe(2);
    expect(pendingEvents.takeNextDue(20)).toMatchObject({ version: 2, event: { internalId: 1, size: 2 } });
  });
});
