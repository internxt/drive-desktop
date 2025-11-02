import { store } from '../store';
import { SyncStateItem } from '../defs';
import { broadcastToFrontend } from './broadcast-to-frontend';

export function addItem(item: SyncStateItem) {
  const previous = store.items[item.path];
  if (previous) clearTimeout(previous.timeout);

  store.items[item.path] = {
    ...item,
    time: Date.now(),
    timeout: setTimeout(() => {
      delete store.items[item.path];
    }, 10000),
  };

  if (!store.notifyInterval) {
    broadcastToFrontend();
    store.notifyInterval = setInterval(broadcastToFrontend, 1000);
  }
}
