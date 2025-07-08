import Logger from 'electron-log';
import { driveServerModule } from '../../../infra/drive-server/drive-server.module';
import { fold } from '../../../context/shared/domain/Fold';
import configStore, { defaults, fieldsToSave } from '../../../apps/main/config';
import { getUser } from '../../../apps/main/auth/service';

const keepFields: Array<keyof typeof defaults> = [
  'preferedLanguage',
  'lastOnboardingShown',
];

function resetCredentials(): void {
  for (const field of [
    'mnemonic',
    'userData',
    'bearerToken',
    'bearerTokenEncrypted',
    'newToken',
  ] as const) {
    configStore.set(field, defaults[field]);
  }
}

function saveConfig(): void {
  const user = getUser();
  if (!user) {
    return;
  }

  const { uuid } = user;

  const savedConfigs = configStore.get('savedConfigs');

  const configToSave: any = {};

  for (const field of fieldsToSave) {
    const value = configStore.get(field);
    configToSave[field] = value;
  }
  configStore.set('savedConfigs', {
    ...savedConfigs,
    [uuid]: configToSave,
  });
}

function resetConfig(): void {
  for (const field of fieldsToSave) {
    if (!keepFields.includes(field)) {
      configStore.set(field, defaults[field]);
    }
  }
}

export function logout() {
  driveServerModule.auth.logout().then((result) => {
    fold(
      result,
      (error) => {
        Logger.error('[AUTH] Error during server logout:', error);
      },
      (success) => {
        Logger.info('[AUTH] Server logout successful:', success);
      }
    );
  });
  saveConfig();
  resetConfig();
  resetCredentials();
  Logger.info('[AUTH] User logged out');
}
