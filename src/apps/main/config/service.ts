import type { AppStore } from '../../../core/electron/store/app-store.interface';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { electronStore } from '../config';
import { broadcastTheme } from '../../../core/theme';
import { broadcastLanguage } from './language';
import type { SetConfigKeyProps, StoredValues } from './service.types';
import { setMainI18nLanguage } from '../localize/i18n.service';

export const getConfigKey = <T extends StoredValues>(key: T): AppStore[T] => {
  return electronStore.get(key);
};

export const setConfigKey = ({ key, value }: SetConfigKeyProps): void => {
  logger.debug({ msg: 'Config key updated', key, value });

  electronStore.set(key, value);

  if (key === 'preferedLanguage') {
    broadcastLanguage();
    void setMainI18nLanguage({ language: value });
  } else if (key === 'preferedTheme') {
    broadcastTheme();
  }
};
