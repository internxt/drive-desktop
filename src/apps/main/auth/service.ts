import { safeStorage } from 'electron';
import Logger from 'electron-log';

import packageConfig from '../../../../package.json';
import ConfigStore, { defaults, fieldsToSave } from '../config';
import { User } from '../types';
import { Delay } from '../../shared/Delay';

const TOKEN_ENCODING = 'latin1';

const tokensKeys = ['bearerToken', 'newToken'] as const;
type TokenKey = (typeof tokensKeys)[number];
type EncryptedTokenKey = `${(typeof tokensKeys)[number]}Encrypted`;

export function encryptToken() {
  const bearerTokenEncrypted = ConfigStore.get('bearerTokenEncrypted');

  if (bearerTokenEncrypted) {
    return;
  }

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

function ecnryptToken(token: string): string {
  const buffer = safeStorage.encryptString(token);

  return buffer.toString(TOKEN_ENCODING);
}

export async function setCredentials(
  userData: User,
  mnemonic: string,
  bearerToken: string,
  newToken: string
) {
  ConfigStore.set('mnemonic', mnemonic);
  ConfigStore.set('userData', userData);

  await Delay.ms(1_000);
  // In the version of electron we are using calling
  // isEncryptionAvailable or decryptString "too son" will crash the app
  // we will be able to remove once we can update the electron version

  const isSafeStorageAvailable = safeStorage.isEncryptionAvailable();

  const token = isSafeStorageAvailable
    ? ecnryptToken(bearerToken)
    : bearerToken;

  ConfigStore.set('bearerToken', token);
  ConfigStore.set('bearerTokenEncrypted', isSafeStorageAvailable);

  const secondToken = isSafeStorageAvailable
    ? ecnryptToken(newToken)
    : newToken;

  ConfigStore.set('newToken', secondToken);
  ConfigStore.set('newTokenEncrypted', isSafeStorageAvailable);
}

export function updateCredentials(
  bearerToken: string,
  newBearerToken?: string
) {
  const isSafeStorageAvailable = safeStorage.isEncryptionAvailable();

  const token = isSafeStorageAvailable
    ? ecnryptToken(bearerToken)
    : bearerToken;

  ConfigStore.set('bearerToken', token);
  ConfigStore.set('bearerTokenEncrypted', isSafeStorageAvailable);

  if (!newBearerToken) {
    return;
  }

  const secondToken = isSafeStorageAvailable
    ? ecnryptToken(newBearerToken)
    : newBearerToken;

  ConfigStore.set('newToken', secondToken);
  ConfigStore.set('newTokenEncrypted', isSafeStorageAvailable);
}

export function getHeaders(includeMnemonic = false): Record<string, string> {
  const token = obtainToken('bearerToken');

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

export function getNewApiHeaders(): Record<string, string> {
  const token = obtainToken('newToken');

  return {
    Authorization: `Bearer ${token}`,
    'content-type': 'application/json; charset=utf-8',
    'internxt-client': 'drive-desktop',
    'internxt-version': packageConfig.version,
  };
}

export function getUser(): User | null {
  const user = ConfigStore.get('userData');

  return user && Object.keys(user).length ? user : null;
}

export function obtainToken(tokenName: TokenKey): string {
  const token = ConfigStore.get(tokenName);
  const isEncrypted = ConfigStore.get<EncryptedTokenKey>(
    `${tokenName}Encrypted`
  );

  if (!isEncrypted) {
    return token;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      '[AUTH] Safe Storage was not available when decrypting encrypted token'
    );
  }

  const buffer = Buffer.from(token, TOKEN_ENCODING);

  return safeStorage.decryptString(buffer);
}

export function tokensArePresent(): boolean {
  const tokens = tokensKeys
    .map((token) => ConfigStore.get(token))
    .filter((token) => token && token.length !== 0);

  return tokens.length === tokensKeys.length;
}

export function obtainTokens(): Array<string> {
  return tokensKeys.map(obtainToken);
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

  if (!savedConfigs) return;
  const savedConfig = savedConfigs[uuid];

  if (!savedConfig) {
    return false;
  }

  for (const [key, value] of Object.entries(savedConfig)) {
    ConfigStore.set(key, value);
  }

  return true;
}

export function logout() {
  Logger.info('Logging out');

  saveConfig();
  resetConfig();
  resetCredentials();
  Logger.info('[AUTH] User logged out');
}

function saveConfig() {
  const user = getUser();
  if (!user) {
    return;
  }

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

const keepFields: Array<keyof typeof defaults> = [
  'preferedLanguage',
  'lastOnboardingShown',
];

function resetConfig() {
  for (const field of fieldsToSave) {
    if (!keepFields.includes(field)) {
      ConfigStore.set(field, defaults[field]);
    }
  }
}
