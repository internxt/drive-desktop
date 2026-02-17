import store, { AppStore } from '../config';
import { broadcastToWindows } from '../windows';

export type StoredValues = keyof AppStore;

export const getConfigKey = <T extends StoredValues>(key: T): AppStore[T] => {
  return store.get(key);
};

export const setConfigKey = <T extends StoredValues>(key: T, value: AppStore[T]): void => {
  store.set(key, value);
  broadcastToWindows(`${key}-updated`, value);
};
