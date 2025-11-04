import { AuthContext } from '@/backend/features/auth/utils/context';
import { getUser } from '../main/auth/service';
import { FolderUuid } from '../main/database/entities/DriveFolder';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export type Config = {
  userUuid: string;
  providerId: string;
  rootPath: string;
  rootUuid: FolderUuid;
  providerName: string;
  loggerPath: string;
  workspaceId: string;
  workspaceToken: string;
  bucket: string;
  mnemonic: string;
  bridgeUser: string;
  bridgePass: string;
};

export type SyncContext = AuthContext & Config & { logger: typeof logger };

export type ProcessSyncContext = SyncContext & {
  virtualDrive: VirtualDrive;
  fileUploader: EnvironmentFileUploader;
};

const emptyValues = (): Config => {
  return {
    userUuid: '',
    providerId: '',
    rootPath: '',
    providerName: '',
    loggerPath: '',
    workspaceId: '',
    rootUuid: '' as FolderUuid,
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
