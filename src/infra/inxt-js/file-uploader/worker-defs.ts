import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { EnvironmentConfig } from '@internxt/inxt-js/build/api';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';

export type UploadRequest = {
  type: 'upload';
  path: AbsolutePath;
  size: number;
  bucketId: string;
  config: EnvironmentConfig;
};

export type AbortRequest = {
  type: 'abort';
  path: AbsolutePath;
};

export type WorkerRequest = UploadRequest | AbortRequest;

export type ProgressResponse = { type: 'progress'; path: AbsolutePath; progress: number };
export type SuccessResponse = { type: 'success'; path: AbsolutePath; contentsId: ContentsId };
export type ErrorResponse = {
  type: 'error';
  path: AbsolutePath;
  code: 'ABORTED' | 'MAX_SPACE_USED' | 'SERVER' | 'UNKNOWN';
  error?: unknown;
};

export type WorkerResponse = ProgressResponse | SuccessResponse | ErrorResponse;
