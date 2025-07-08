import store, { AppStore } from '../config';
import { broadcastToWindows } from '../windows';

export type StoredValues = keyof AppStore;

export const getConfigKey = <T extends StoredValues>(key: T): AppStore[T] => {
  return store.get(key);
};

type SetConfigKeyProps = { key: 'preferedLanguage'; value: string } | { key: 'preferedTheme'; value: string };

export const setConfigKey = ({ key, value }: SetConfigKeyProps): void => {
  store.set(key, value);
  broadcastToWindows({ name: `${key}-updated`, data: value });
};
