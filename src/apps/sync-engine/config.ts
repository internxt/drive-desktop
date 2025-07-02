import { getUser } from '../main/auth/service';

export type Config = {
  userUuid: string;
  providerId: string;
  rootPath: string;
  rootUuid: string;
  providerName: string;
  loggerPath: string;
  queueManagerPath: string;
  workspaceId: string;
  workspaceToken: string;
  bucket: string;
  mnemonic: string;
  bridgeUser: string;
  bridgePass: string;
};

const emptyValues = (): Config => {
  return {
    userUuid: '',
    providerId: '',
    rootPath: '',
    providerName: '',
    loggerPath: '',
    queueManagerPath: '',
    workspaceId: '',
    rootUuid: '',
    bucket: '',
    mnemonic: '',
    bridgePass: '',
    bridgeUser: '',
    workspaceToken: '',
  };
};

let config: Config = emptyValues();

const defaultValues = (): Config => {
  const user = getUser();

  if (!user) {
    return emptyValues();
  }

  return {
    userUuid: user.uuid,
    providerId: config.providerId,
    rootPath: config.rootPath,
    providerName: config.providerName,
    loggerPath: config.loggerPath,
    queueManagerPath: config.queueManagerPath,
    workspaceId: config.workspaceId,
    rootUuid: config.rootUuid,
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
