import { logger } from '@/apps/shared/logger/logger';
import Bottleneck from 'bottleneck';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createReadStream } from 'node:fs';
import { uploadFile } from './upload-file';
import { LocalSync } from '@/backend/features';
import { CommonContext } from '@/apps/sync-engine/config';

const MULTIPART_UPLOAD_SIZE_THRESHOLD = 100 * 1024 * 1024;

const limiter = new Bottleneck({ maxConcurrent: 4 });

type TProps = {
  ctx: CommonContext;
  path: AbsolutePath;
  size: number;
};

export class EnvironmentFileUploader {
  static upload({ ctx, path, size }: TProps) {
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

    return uploadFile({ ctx, fn, readable, size, path });
  }

  static async run(props: TProps) {
    return await limiter.schedule(() => this.upload(props));
  }
}
