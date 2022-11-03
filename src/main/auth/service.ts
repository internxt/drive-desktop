import { safeStorage } from 'electron';
import ConfigStore, { defaults, fieldsToSave } from '../config';
import packageConfig from '../../../package.json';
import { User } from '../types';

const TOKEN_ENCODING = 'latin1';

export function setCredentials(
  userData: User,
  mnemonic: string,
  bearerToken: string,
  newToken: string
) {
  ConfigStore.set('mnemonic', mnemonic);
  ConfigStore.set('userData', userData);
  ConfigStore.set('bearerToken', bearerToken);

  const newTokenBuffer = safeStorage.encryptString(newToken);
  const encryptedNewToken = newTokenBuffer.toString(TOKEN_ENCODING);

  ConfigStore.set('newToken', encryptedNewToken);
}

export function getHeaders(includeMnemonic = false) {
  const token = ConfigStore.get('bearerToken');
  const header = {
    Authorization: `Bearer ${token}`,
    'content-type': 'application/json; charset=utf-8',
    'internxt-client': 'drive-desktop',
    'internxt-version': packageConfig.version,
    ...(includeMnemonic
      ? {
          'internxt-mnemonic': ConfigStore.get('mnemonic'),
        }
      : {}),
  };

  return header;
}

export function getUser(): User | null {
  const user = ConfigStore.get('userData');
  return Object.keys(user).length ? user : null;
}

export function getToken() {
  return ConfigStore.get('bearerToken');
}

export function getNewToken(): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Safe Storage is not available');
  }

  const encrypedToken = ConfigStore.get('newToken');
  const buffer = Buffer.from(encrypedToken, TOKEN_ENCODING);

  return safeStorage.decryptString(buffer);
}

function resetCredentials() {
  for (const field of ['mnemonic', 'userData', 'bearerToken'] as const) {
    ConfigStore.set(field, defaults[field]);
  }
}

export function canHisConfigBeRestored(uuid: string) {
  const savedConfigs = ConfigStore.get('savedConfigs');

  const savedConfig = savedConfigs[uuid];

  if (!savedConfig) return false;

  for (const [key, value] of Object.entries(savedConfig)) {
    ConfigStore.set(key, value);
  }

  return true;
}

export function logout() {
  saveConfig();
  resetConfig();
  resetCredentials();
}

function saveConfig() {
  const user = getUser();
  if (!user) return;

  const { uuid } = user;

  const savedConfigs = ConfigStore.get('savedConfigs');

  const configToSave: any = {};

  for (const field of fieldsToSave) {
    const value = ConfigStore.get(field);
    configToSave[field] = value;
  }

  ConfigStore.set('savedConfigs', {
    ...savedConfigs,
    [uuid]: configToSave,
  });
}

function resetConfig() {
  for (const field of fieldsToSave) {
    ConfigStore.set(field, defaults[field]);
  }
}
