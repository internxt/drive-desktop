import { ExtendedSyncStateItem, SyncStateItem } from './defs';

type Store = {
  items: Record<SyncStateItem['key'], ExtendedSyncStateItem>;
  notifyInterval: NodeJS.Timeout | undefined;
};

export const store: Store = {
  items: {},
  notifyInterval: undefined,
};

export function clearStore() {
  clearInterval(store.notifyInterval);
  store.items = {};
  store.notifyInterval = undefined;
}
