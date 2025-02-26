export interface Config {
  providerId: string;
  rootPath: string;
  rootUuid: string;
  providerName: string;
  loggerPath: string;
  workspaceId: string;
  workspaceToken?: string | null;
}

let config: Config = {
  providerId: '',
  rootPath: '',
  providerName: '',
  loggerPath: '',
  workspaceId: '',
  rootUuid: '',
  workspaceToken: null,
};

export function setConfig(newConfig: Config) {
  config = { ...config, ...newConfig };
}

export function getConfig(): Config {
  return config;
}
