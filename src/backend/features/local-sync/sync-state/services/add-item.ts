import { store } from '../store';
import { SyncStateItem } from '../sync-state.meta';
import { broadcastToFrontend } from './broadcast-to-frontend';

export function addItem(item: SyncStateItem) {
  const previous = store.items[item.key];
  if (previous) clearTimeout(previous.timeout);

  store.items[item.key] = {
    ...item,
    time: Date.now(),
    timeout: setTimeout(() => {
      delete store.items[item.key];
    }, 10000),
  };

  if (!store.notifyInterval) {
    broadcastToFrontend();
    store.notifyInterval = setInterval(broadcastToFrontend, 1000);
  }
}
