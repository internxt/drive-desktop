export interface Config {
  providerId: string;
  rootPath: string;
  providerName: string;
  loggerPath: string;
}

let config: Config = {
  providerId: '',
  rootPath: '',
  providerName: '',
  loggerPath: '',
};

export function setConfig(newConfig: Config) {
  config = { ...config, ...newConfig };
}

export function getConfig(): Config {
  return config;
}
