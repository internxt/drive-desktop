import { getUser } from '../main/auth/service';

export interface Config {
  providerId: string;
  rootPath: string;
  rootUuid: string;
  providerName: string;
  loggerPath: string;
  workspaceId: string;
  workspaceToken?: string | null;
  bucket: string;
  mnemonic: string;
}

const getDefaultConfig = (): Config => {
  const user = getUser();
  return {
    providerId: '',
    rootPath: '',
    providerName: '',
    loggerPath: '',
    workspaceId: '',
    rootUuid: '',
    bucket: user?.bucket || '',
    mnemonic: user?.mnemonic || '',
    workspaceToken: null,
  };
};

let config: Config = getDefaultConfig();

export function setConfig(newConfig: Config) {
  config = { ...config, ...newConfig };
}

export function getConfig(): Config {
  return config;
}
