import { AppStore } from '@/core/electron/store/app-store.interface';
import store from '../config';
import { broadcastToWindows } from '../windows';
import { ConfigTheme } from '@/apps/shared/types/Theme';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { broadcastTheme } from '../theme/theme';

export type StoredValues = keyof AppStore;

export const getConfigKey = <T extends StoredValues>(key: T): AppStore[T] => {
  return store.get(key);
};

type SetConfigKeyProps = { key: 'preferedLanguage'; value: string } | { key: 'preferedTheme'; value: ConfigTheme };

export const setConfigKey = ({ key, value }: SetConfigKeyProps): void => {
  logger.debug({ msg: 'Config key updated', key, value });

  store.set(key, value);

  if (key === 'preferedLanguage') broadcastToWindows({ name: 'preferedLanguage-updated', data: value });
  else broadcastTheme();
};
