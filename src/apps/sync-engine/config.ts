import { AuthContext } from '@/backend/features/auth/utils/context';
import { getUser } from '../main/auth/service';
import { FolderUuid } from '../main/database/entities/DriveFolder';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { AbsolutePath, logger } from '@internxt/drive-desktop-core/build/backend';
import { InxtJs } from '@/infra';

export type Config = {
  userUuid: string;
  providerId: string;
  rootPath: AbsolutePath;
  rootUuid: FolderUuid;
  providerName: string;
  workspaceId: string;
  workspaceToken: string;
  bucket: string;
  mnemonic: string;
  bridgeUser: string;
  bridgePass: string;
};

export type SyncContext = AuthContext & Config & { logger: typeof logger };

export type ProcessSyncContext = SyncContext & {
  fileUploader: EnvironmentFileUploader;
  contentsDownloader: InxtJs.ContentsDownloader;
};

const emptyValues = (): Config => {
  return {
    userUuid: '',
    providerId: '',
    rootPath: '' as AbsolutePath,
    providerName: '',
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
