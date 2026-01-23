import { FolderUuid } from '../main/database/entities/DriveFolder';
import { AbsolutePath, logger } from '@internxt/drive-desktop-core/build/backend';
import { InxtJs } from '@/infra';
import { Environment } from '@internxt/inxt-js';
import Bottleneck from 'bottleneck';
import { Client } from 'openapi-fetch';
import { paths } from '../shared/HttpClient/schema';

export type AuthContext = {
  readonly abortController: AbortController;
  readonly wipBottleneck: Bottleneck;
  readonly uploadBottleneck: Bottleneck;
  readonly client: Client<paths, `${string}/${string}`>;
  workspaceToken: string;
};

export type CommonContext = AuthContext & {
  readonly userUuid: string;
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
