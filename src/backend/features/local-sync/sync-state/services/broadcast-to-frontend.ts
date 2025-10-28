import { broadcastToWidget } from '@/apps/main/windows';
import { clearStore, store } from '../store';
import { ExtendedSyncStateItem, PRIORITIES, SyncStateItem } from '../defs';

export function getSortedItems(items: ExtendedSyncStateItem[]): SyncStateItem[] {
  return items
    .toSorted((a, b) => {
      const priorityDiff = PRIORITIES[a.action] - PRIORITIES[b.action];
      if (priorityDiff !== 0) return priorityDiff;
      return b.time - a.time;
    })
    .slice(0, 5)
    .map((item) => ({
      action: item.action,
      key: item.key,
      name: item.name,
      progress: item.progress,
    }));
}

export function broadcastToFrontend() {
  const items = getSortedItems(Object.values(store.items));

  if (items.length === 0) clearStore();

  broadcastToWidget({ name: 'sync-info-update', data: items });
}
