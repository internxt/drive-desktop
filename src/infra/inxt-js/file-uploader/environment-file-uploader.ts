import { logger } from '@/apps/shared/logger/logger';
import { EnvironmentFileUploaderError } from './process-error';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import Bottleneck from 'bottleneck';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createReadStream } from 'node:fs';
import { uploadFile } from './upload-file';
import { CommonContext } from '@/apps/sync-engine/config';
import { LocalSync } from '@/backend/features';

const MULTIPART_UPLOAD_SIZE_THRESHOLD = 100 * 1024 * 1024;

const limiter = new Bottleneck({ maxConcurrent: 4 });

export type TResolve = (_: { data: ContentsId; error?: undefined } | { data?: undefined; error: EnvironmentFileUploaderError }) => void;

type TProps = {
  ctx: CommonContext;
  path: AbsolutePath;
  size: number;
  abortSignal: AbortSignal;
};

export class EnvironmentFileUploader {
  static async upload({ ctx, path, size, abortSignal }: TProps) {
    const useMultipartUpload = size > MULTIPART_UPLOAD_SIZE_THRESHOLD;

    logger.debug({
      msg: 'Uploading file to the bucket',
      path,
      size,
      bucket: ctx.bucket,
      useMultipartUpload,
    });

    const readable = createReadStream(path);
    const fn = useMultipartUpload ? ctx.environment.uploadMultipartFile.bind(ctx.environment) : ctx.environment.upload;

    LocalSync.SyncState.addItem({ action: 'UPLOADING', path, progress: 0 });

    return await uploadFile({
      ctx,
      fn,
      readable,
      size,
      path,
      abortSignal,
    });
  }

  static async run(props: TProps) {
    return await limiter.schedule(() => this.upload(props));
  }
}
