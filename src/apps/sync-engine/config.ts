import { getUser } from '../main/auth/service';

export interface Config {
  providerId: string;
  rootPath: string;
  rootUuid: string;
  providerName: string;
  loggerPath: string;
  workspaceId: string;
  workspaceToken?: string;
  bucket: string;
  mnemonic: string;
  bridgeUser: string;
  bridgePass: string;
}

let config: Config = {
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
  workspaceToken: '',
};

const defaultValues = (): Config => {
  const user = getUser();
  if (!user) {
    return config;
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
    workspaceToken: config.workspaceToken || '',
  };
};

export function setConfig(newConfig: Config) {
  config = { ...defaultValues(), ...newConfig };
}

export function getConfig(): Config {
  return config;
}
