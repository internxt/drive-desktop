import { logger } from '@/apps/shared/logger/logger';
import { EnvironmentFileUploaderError } from './process-error';
import { FileUploaderCallbacks } from './file-uploader';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import Bottleneck from 'bottleneck';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createReadStream } from 'node:fs';
import { uploadFile } from './upload-file';
import { CommonContext } from '@/apps/sync-engine/config';

const MULTIPART_UPLOAD_SIZE_THRESHOLD = 100 * 1024 * 1024;

const limiter = new Bottleneck({ maxConcurrent: 4 });

export type TResolve = (_: { data: ContentsId; error?: undefined } | { data?: undefined; error: EnvironmentFileUploaderError }) => void;

type TProps = {
  ctx: CommonContext;
  path: AbsolutePath;
  size: number;
  abortSignal: AbortSignal;
  callbacks: FileUploaderCallbacks;
};

export class EnvironmentFileUploader {
  static upload({ ctx, path, size, abortSignal, callbacks }: TProps) {
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

    callbacks.onProgress({ progress: 0 });

    return uploadFile({
      ctx,
      fn,
      readable,
      size,
      path,
      callbacks,
      abortSignal,
    });
  }

  static async run(props: TProps) {
    return await limiter.schedule(() => this.upload(props));
  }
}
