import { AppStore } from '@/core/electron/store/app-store.interface';
import store from '../config';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { broadcastTheme } from './theme';
import { Language } from '@internxt/drive-desktop-core/build/frontend/core/i18n';
import { broadcastLanguage } from './language';
import { ConfigTheme } from './theme.types';

export type StoredValues = keyof AppStore;

export const getConfigKey = <T extends StoredValues>(key: T): AppStore[T] => {
  return store.get(key);
};

type SetConfigKeyProps = { key: 'preferedLanguage'; value: Language } | { key: 'preferedTheme'; value: ConfigTheme };

export const setConfigKey = ({ key, value }: SetConfigKeyProps): void => {
  logger.debug({ msg: 'Config key updated', key, value });

  store.set(key, value);

  if (key === 'preferedLanguage') broadcastLanguage();
  else if (key === 'preferedTheme') broadcastTheme();
};
