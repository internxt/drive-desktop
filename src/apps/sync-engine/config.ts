import { AbsolutePath, logger } from '@internxt/drive-desktop-core/build/backend';
import { Environment } from '@internxt/inxt-js';
import { EnvironmentConfig } from '@internxt/inxt-js/build/api';
import Bottleneck from 'bottleneck';
import { Client } from 'openapi-fetch';
import { InxtJs } from '@/infra';
import { FolderUuid } from '../main/database/entities/DriveFolder';
import { RemoteSyncStatus } from '../main/remote-sync/helpers';
import { User } from '../main/types';
import { paths } from '../shared/HttpClient/schema';

export type AuthContext = {
  readonly user: User;
  readonly userUuid: string;
  readonly abortController: AbortController;
  readonly driveApiBottleneck: Bottleneck;
  readonly uploadBottleneck: Bottleneck;
  readonly client: Client<paths, `${string}/${string}`>;
  workspaceToken: string;
};

export type CommonContext = AuthContext & {
  readonly workspaceId: string;
  readonly bucket: string;
  readonly environmentConfig: EnvironmentConfig;
  readonly environment: Environment;
  readonly logger: typeof logger;
};

export type SyncContext = CommonContext & {
  status: RemoteSyncStatus;
  readonly providerId: string;
  readonly rootPath: AbsolutePath;
  readonly rootUuid: FolderUuid;
  readonly providerName: string;
  readonly mnemonic: string;
  readonly bridgeUser: string;
  readonly bridgePass: string;
  readonly contentsDownloader: InxtJs.ContentsDownloader;
};

export type ProcessSyncContext = SyncContext;
