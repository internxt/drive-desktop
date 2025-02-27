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

let config: Config = {
  providerId: '',
  rootPath: '',
  providerName: '',
  loggerPath: '',
  workspaceId: '',
  rootUuid: '',
  bucket: '',
  mnemonic: '',
  workspaceToken: null,
};

export function setConfig(newConfig: Config) {
  config = { ...config, ...newConfig };
}

export function getConfig(): Config {
  return config;
}
