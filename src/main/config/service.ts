import { broadcastToWindows } from '../windows';
import store, { AppStore } from '../config';

export type StoredValues = keyof AppStore;

export type ConfigKey<T extends StoredValues> = T;

export const getConfigKey = <T extends StoredValues>(key: T): AppStore[T] => {
  return store.get(key);
};

export const setConfigKey = <T extends StoredValues>(
  key: T,
  value: AppStore[T]
): void => {
  store.set(key, value);
  broadcastToWindows(`${key}-updated`, value);
};
