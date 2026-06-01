import { clearPendingCreations, runAfterParentCreations, runTrackingCreation } from './PendingFolderCreationTracker';

describe('PendingFolderCreationTracker', () => {
  beforeEach(() => {
    clearPendingCreations();
  });

  it('waits for a parent folder creation before running child action', async () => {
    let resolveParentCreation: (() => void) | undefined;
    const events: string[] = [];

    const parentPromise = runTrackingCreation({
      path: '/Documents',
      action: async () => {
        events.push('parent-started');

        await new Promise<void>((resolve) => {
          resolveParentCreation = resolve;
        });

        events.push('parent-finished');
      },
    });

    const childPromise = runAfterParentCreations({
      path: '/Documents/Taxes/file.txt',
      action: async () => {
        events.push('child-started');
      },
    });

    await Promise.resolve();

    expect(events).toStrictEqual(['parent-started']);

    resolveParentCreation?.();

    await parentPromise;
    await childPromise;

    expect(events).toStrictEqual(['parent-started', 'parent-finished', 'child-started']);
  });
});
