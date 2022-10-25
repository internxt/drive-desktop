import { safeStorage } from 'electron';
import ConfigStore, { defaults, fieldsToSave } from '../config';
import packageConfig from '../../../package.json';
import { User } from '../types';

const charset = 'latin1';

export function setCredentials(
  userData: User,
  mnemonic: string,
  bearerToken: string
) {
  ConfigStore.set('mnemonic', mnemonic);
  ConfigStore.set('userData', userData);

  if (safeStorage.isEncryptionAvailable()) {
    const buffer = safeStorage.encryptString(bearerToken);
    const encrypted = buffer.toString(charset);

    ConfigStore.set('bearerToken', encrypted);
    ConfigStore.set('encrypedToken', true);
  } else {
    ConfigStore.set('bearerToken', bearerToken);
    ConfigStore.set('encrypedToken', false);
  }
}

export function getHeaders(includeMnemonic = false) {
  let token = ConfigStore.get('bearerToken');
  const tokenWasEncrypted = ConfigStore.get('encrypedToken') as boolean;

  if (tokenWasEncrypted) {
    try {
      const buffer = Buffer.from(token, charset);
      token = safeStorage.decryptString(buffer);
    } catch (err: any) {
      console.error(err);
    }
  }

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

  console.log(header);
  return header;
}

export function getUser(): User | null {
  const user = ConfigStore.get('userData');
  return Object.keys(user).length ? user : null;
}

export function getToken() {
  let token = ConfigStore.get('bearerToken');
  const tokenWasEncrypted = ConfigStore.get('encrypedToken') as boolean;

  if (tokenWasEncrypted) {
    try {
      const buffer = Buffer.from(token, charset);
      token = safeStorage.decryptString(buffer);
    } catch (err: any) {
      console.error(err);
    }
  }

  return token;
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
