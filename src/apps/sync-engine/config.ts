import { FolderUuid } from '../main/database/entities/DriveFolder';
import { AbsolutePath, logger } from '@internxt/drive-desktop-core/build/backend';
import { InxtJs } from '@/infra';
import { Environment } from '@internxt/inxt-js';

export type AuthContext = {
  readonly abortController: AbortController;
  workspaceToken: string;
};

export type CommonContext = AuthContext & {
  userUuid: string;
  readonly workspaceId: string;
  readonly bucket: string;
  readonly environment: Environment;
  readonly logger: typeof logger;
};

export type SyncContext = CommonContext & {
  readonly providerId: string;
  rootPath: AbsolutePath;
  readonly rootUuid: FolderUuid;
  readonly providerName: string;
  readonly mnemonic: string;
  readonly bridgeUser: string;
  readonly bridgePass: string;
  readonly contentsDownloader: InxtJs.ContentsDownloader;
};

export type ProcessSyncContext = SyncContext;
