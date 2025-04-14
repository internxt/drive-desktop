import { getUser } from '../main/auth/service';

export type Config = {
  providerId: string;
  rootPath: string;
  rootUuid: string;
  providerName: string;
  loggerPath: string;
  workspaceId: string;
  workspaceToken: string | undefined;
  bucket: string;
  mnemonic: string;
  bridgeUser: string;
  bridgePass: string;
};

const emptyValues = (): Config => {
  return {
    providerId: '',
    rootPath: '',
    providerName: '',
    loggerPath: '',
    workspaceId: '',
    rootUuid: '',
    bucket: '',
    mnemonic: '',
    bridgePass: '',
    bridgeUser: '',
    workspaceToken: undefined,
  };
};

let config: Config = emptyValues();

const defaultValues = (): Config => {
  const user = getUser();

  if (!user) {
    return emptyValues();
  }

  return {
    providerId: config.providerId || '',
    rootPath: config.rootPath || '',
    providerName: config.providerName || '',
    loggerPath: config.loggerPath || '',
    workspaceId: config.workspaceId || '',
    rootUuid: config.rootUuid || '',
    bucket: user.bucket || config.bucket,
    mnemonic: user.mnemonic || config.mnemonic,
    bridgeUser: user.bridgeUser || config.bridgeUser,
    bridgePass: user.userId || config.bridgePass,
    workspaceToken: config.workspaceToken,
  };
};

export function setConfig(newConfig: Config) {
  config = newConfig;
}

export function setDefaultConfig(newConfig: Partial<Config>) {
  config = { ...defaultValues(), ...newConfig };
}
export function getConfig(): Config {
  return config;
}

export function clearConfig() {
  config = emptyValues();
}
