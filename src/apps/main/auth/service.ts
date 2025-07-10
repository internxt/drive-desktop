import { parseAndDecryptUserKeys } from '../../../apps/shared/crypto/keys.service';
import { safeStorage } from 'electron';
import Logger from 'electron-log';
import packageConfig from '../../../../package.json';
import ConfigStore, { defaults, fieldsToSave } from '../config';
import { User } from '../types';

const TOKEN_ENCODING = 'latin1';

const tokensKeys = ['bearerToken', 'newToken'] as const;
type TokenKey = (typeof tokensKeys)[number];
type EncryptedTokenKey = `${(typeof tokensKeys)[number]}Encrypted`;

type Credentials = {
  userData: User;
  bearerToken: string;
  newToken: string;
  password: string;
};

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

export function obtainToken(tokenName: TokenKey): string {
  const token = ConfigStore.get(tokenName);
  const isEncrypted = ConfigStore.get<EncryptedTokenKey>(`${tokenName}Encrypted`);

  if (!isEncrypted) {
    return token;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('[AUTH] Safe Storage was not available when decrypting encrypted token');
  }

  const buffer = Buffer.from(token, TOKEN_ENCODING);

  return safeStorage.decryptString(buffer);
}

function ecnryptToken(token: string): string {
  const buffer = safeStorage.encryptString(token);

  return buffer.toString(TOKEN_ENCODING);
}

export function setUser(userData: User) {
  ConfigStore.set('userData', {
    ...userData,
    needLogout: false,
  });
}

export function setCredentials({ userData, bearerToken, newToken, password }: Credentials) {
  const { publicKey, privateKey, publicKyberKey, privateKyberKey } = parseAndDecryptUserKeys(userData, password);

  userData.publicKey = publicKey;
  userData.privateKey = privateKey;
  userData.keys.ecc.publicKey = publicKey;
  userData.keys.ecc.privateKey = privateKey;
  userData.keys.kyber.publicKey = publicKyberKey;
  userData.keys.kyber.privateKey = privateKyberKey;

  setUser(userData);

  const isSafeStorageAvailable = safeStorage.isEncryptionAvailable();

  const token = isSafeStorageAvailable ? ecnryptToken(bearerToken) : bearerToken;

  ConfigStore.set('bearerToken', token);
  ConfigStore.set('bearerTokenEncrypted', isSafeStorageAvailable);

  const secondToken = isSafeStorageAvailable ? ecnryptToken(newToken) : newToken;

  ConfigStore.set('newToken', secondToken);
  ConfigStore.set('newTokenEncrypted', isSafeStorageAvailable);
}
export function updateCredentials(bearerToken: string, newBearerToken?: string) {
  const isSafeStorageAvailable = safeStorage.isEncryptionAvailable();

  const token = isSafeStorageAvailable ? ecnryptToken(bearerToken) : bearerToken;

  ConfigStore.set('bearerToken', token);
  ConfigStore.set('bearerTokenEncrypted', isSafeStorageAvailable);

  if (!newBearerToken) {
    return;
  }

  const secondToken = isSafeStorageAvailable ? ecnryptToken(newBearerToken) : newBearerToken;

  ConfigStore.set('newToken', secondToken);
  ConfigStore.set('newTokenEncrypted', isSafeStorageAvailable);
}

export function getUser(): User | null {
  const user = ConfigStore.get('userData');

  return user && Object.keys(user).length ? user : null;
}

export function getUserOrThrow(): User {
  const user = getUser();
  if (!user) throw new Error('User not found');
  return user;
}

export function obtainTokens(): Array<string> {
  return tokensKeys.map(obtainToken);
}

function resetCredentials() {
  for (const field of ['mnemonic', 'userData', 'bearerToken', 'bearerTokenEncrypted', 'newToken'] as const) {
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

function saveConfig() {
  const user = getUser();
  if (!user) {
    return;
  }

  const { uuid } = user;

  const savedConfigs = ConfigStore.get('savedConfigs');

  const configToSave: Record<string, unknown> = {};

  for (const field of fieldsToSave) {
    const value = ConfigStore.get(field);
    configToSave[field] = value;
  }

  ConfigStore.set('savedConfigs', {
    ...savedConfigs,
    [uuid]: configToSave,
  });
}

const keepFields = ['preferedLanguage'];

function resetConfig() {
  for (const field of fieldsToSave) {
    if (!keepFields.includes(field)) {
      ConfigStore.set(field, defaults[field]);
    }
  }
}

export function logout() {
  Logger.info('Loggin out');
  saveConfig();
  resetConfig();
  resetCredentials();
  Logger.info('[AUTH] User logged out');
}
