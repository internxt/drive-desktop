import { AppStore } from '@/core/electron/store/app-store.interface';
import store from '../config';
import { broadcastToWindows } from '../windows';
import { Theme } from '@/apps/shared/types/Theme';

export type StoredValues = keyof AppStore;

export const getConfigKey = <T extends StoredValues>(key: T): AppStore[T] => {
  return store.get(key);
};

type SetConfigKeyProps = { key: 'preferedLanguage'; value: string } | { key: 'preferedTheme'; value: Theme };

export const setConfigKey = ({ key, value }: SetConfigKeyProps): void => {
  store.set(key, value);
  broadcastToWindows({ name: `${key}-updated`, data: value });
};
