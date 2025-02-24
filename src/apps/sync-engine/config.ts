export interface Config {
  providerId: string;
  rootPath: string;

  rootUid: string;
  providerName: string;
  loggerPath: string;

  workspaceId: string;
}

let config: Config = {
  providerId: '',
  rootPath: '',
  providerName: '',
  loggerPath: '',
  workspaceId: '',
  rootUid: '',
};

export function setConfig(newConfig: Config) {
  config = { ...config, ...newConfig };
}

export function getConfig(): Config {
  return config;
}
