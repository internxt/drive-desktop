import { safeStorage } from 'electron';
import ConfigStore from '../config';
import { User } from '../types';

const TOKEN_ENCODING = 'latin1';

export function obtainToken(): string {
  const token = ConfigStore.get('newToken');
  const isEncrypted = ConfigStore.get('newTokenEncrypted');

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

export function updateCredentials({ newToken }: { newToken: string }) {
  const isSafeStorageAvailable = safeStorage.isEncryptionAvailable();

  const token = isSafeStorageAvailable ? ecnryptToken(newToken) : newToken;

  ConfigStore.set('newToken', token);
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

export function restoreSavedConfig({ uuid }: { uuid: string }) {
  const savedConfigs = ConfigStore.get('savedConfigs');
  const savedConfig = savedConfigs[uuid];

  if (!savedConfig) return;

  for (const key of Object.keys(savedConfig) as Array<keyof typeof savedConfig>) {
    ConfigStore.set(key, savedConfig[key]);
  }
}
