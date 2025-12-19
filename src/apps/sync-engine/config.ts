import { AuthContext } from '@/backend/features/auth/utils/context';
import { FolderUuid } from '../main/database/entities/DriveFolder';
import { AbsolutePath, logger } from '@internxt/drive-desktop-core/build/backend';
import { InxtJs } from '@/infra';
import { Environment } from '@internxt/inxt-js';

export type CommonContext = {
  userUuid: string;
  workspaceId: string;
  workspaceToken: string;
  bucket: string;
  environment: Environment;
};

export type SyncContext = AuthContext &
  CommonContext & {
    providerId: string;
    rootPath: AbsolutePath;
    rootUuid: FolderUuid;
    providerName: string;
    mnemonic: string;
    bridgeUser: string;
    bridgePass: string;
    logger: typeof logger;
    contentsDownloader: InxtJs.ContentsDownloader;
  };

export type ProcessSyncContext = SyncContext;
