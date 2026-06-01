import { logger } from '@internxt/drive-desktop-core/build/backend';

import packageConfig from '../../../../package.json';
import ConfigStore, { defaults, fieldsToSave } from '../config';
import { User } from '../types';
import { driveServerModule } from '../../../infra/drive-server/drive-server.module';
import { getCredentials } from './get-credentials';
import { saveConfig, savedConfigFields } from '../config/save-config';
import eventBus from '../event-bus';

export function getUser(): User | null {
  const user = ConfigStore.get('userData');

  return user && Object.keys(user).length ? user : null;
}

const keepFields: Array<keyof typeof defaults> = ['preferedLanguage', 'lastOnboardingShown'];
function resetConfig() {
  for (const field of fieldsToSave) {
    if (!keepFields.includes(field)) {
      ConfigStore.set(field, defaults[field]);
    }
  }
}

export function getBaseApiHeaders(): Record<string, string> {
  return {
    'content-type': 'application/json; charset=utf-8',
    'internxt-client': 'drive-desktop-linux',
    'internxt-version': packageConfig.version,
    'x-internxt-desktop-header': process.env.INTERNXT_DESKTOP_HEADER_KEY || '',
  };
}

export function getNewApiHeaders(): Record<string, string> {
  const { newToken } = getCredentials();

  return {
    Authorization: `Bearer ${newToken}`,
    ...getBaseApiHeaders(),
  };
}

function resetCredentials() {
  for (const field of ['mnemonic', 'mnemonicEncrypted', 'userData', 'newToken', 'newTokenEncrypted'] as const) {
    ConfigStore.set(field, defaults[field]);
  }
}

export function canHisConfigBeRestored({ uuid }: { uuid: string }) {
  const savedConfigs = ConfigStore.get('savedConfigs');

  if (!savedConfigs) return false;
  const savedConfig = savedConfigs[uuid];

  if (!savedConfig) {
    return false;
  }

  for (const key of savedConfigFields) {
    ConfigStore.set(key, savedConfig[key] ?? defaults[key]);
  }

  return true;
}

export function logout() {
  logger.debug({ msg: 'Logging out' });
  eventBus.emit('USER_LOGGED_OUT');

  const user = getUser();
  if (!user) return;

  const { uuid } = user;

  saveConfig({ uuid });
  void driveServerModule.auth.logout();
  resetConfig();
  resetCredentials();
  logger.debug({ msg: '[AUTH] User logged out' });
}
