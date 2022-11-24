import { safeStorage } from 'electron';
import Logger from 'electron-log';
import ConfigStore, { defaults, fieldsToSave } from '../config';
import packageConfig from '../../../package.json';
import { User } from '../types';

const TOKEN_ENCODING = 'latin1';

export function encryptToken() {
  const bearerTokenEncrypted = ConfigStore.get('bearerTokenEncrypted');

  if (bearerTokenEncrypted) return;

  Logger.info('TOKEN WAS NOT ENCRYPTED, ENCRYPTING...');

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Safe Storage is not available');
  }

  const plainToken = ConfigStore.get('bearerToken');

  const buffer = safeStorage.encryptString(plainToken);
  const encryptedToken = buffer.toString(TOKEN_ENCODING);

  ConfigStore.set('bearerToken', encryptedToken);
  ConfigStore.set('bearerTokenEncrypted', true);
}

export function setCredentials(
  userData: User,
  mnemonic: string,
  bearerToken: string,
  newToken: string
) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Safe Storage is not available');
  }

  ConfigStore.set('mnemonic', mnemonic);
  ConfigStore.set('userData', userData);

  const buffer = safeStorage.encryptString(bearerToken);
  const encryptedToken = buffer.toString(TOKEN_ENCODING);

  ConfigStore.set('bearerToken', encryptedToken);
  ConfigStore.set('bearerTokenEncrypted', true);

  const newTokenBuffer = safeStorage.encryptString(newToken);
  const encryptedNewToken = newTokenBuffer.toString(TOKEN_ENCODING);

  ConfigStore.set('newToken', encryptedNewToken);
}

export function updateCredentials(
  bearerToken: string,
  newBearerToken?: string
) {
  const buffer = safeStorage.encryptString(bearerToken);
  const encryptedToken = buffer.toString(TOKEN_ENCODING);

  ConfigStore.set('bearerToken', encryptedToken);
  ConfigStore.set('bearerTokenEncrypted', true);

  if (!newBearerToken) {
    return;
  }

  const newTokenBuffer = safeStorage.encryptString(newBearerToken);
  const encryptedNewToken = newTokenBuffer.toString(TOKEN_ENCODING);

  ConfigStore.set('newToken', encryptedNewToken);
}

export function getHeaders(includeMnemonic = false): Record<string, string> {
  const token = getToken();

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

export function getToken(): string {
  const bearerTokenEncrypted = ConfigStore.get('bearerTokenEncrypted');

  if (!bearerTokenEncrypted) {
    return ConfigStore.get('bearerToken');
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Safe Storage is not available');
  }

  const encrypedToken = ConfigStore.get('bearerToken');
  const buffer = Buffer.from(encrypedToken, TOKEN_ENCODING);

  return safeStorage.decryptString(buffer);
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
  for (const field of [
    'mnemonic',
    'userData',
    'bearerToken',
    'bearerTokenEncrypted',
    'newToken',
  ] as const) {
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
  Logger.info('[AUTH] User logged out');
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
