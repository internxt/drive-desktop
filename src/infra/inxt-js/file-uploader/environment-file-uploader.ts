import { Environment } from '@internxt/inxt-js/build';
import { logger } from '@/apps/shared/logger/logger';
import { EnvironmentFileUploaderError } from './process-error';
import { FileUploaderCallbacks } from './file-uploader';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import Bottleneck from 'bottleneck';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createReadStream } from 'node:fs';
import { uploadFile } from './upload-file';

const MULTIPART_UPLOAD_SIZE_THRESHOLD = 100 * 1024 * 1024;

const limiter = new Bottleneck({ maxConcurrent: 4 });

export type TResolve = (_: { data: ContentsId; error?: undefined } | { data?: undefined; error: EnvironmentFileUploaderError }) => void;

type TProps = {
  absolutePath: AbsolutePath;
  path: string;
  size: number;
  abortSignal: AbortSignal;
  callbacks: FileUploaderCallbacks;
};

export class EnvironmentFileUploader {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  upload({ absolutePath, path, size, abortSignal, callbacks }: TProps) {
    const useMultipartUpload = size > MULTIPART_UPLOAD_SIZE_THRESHOLD;

    logger.debug({
      msg: 'Uploading file to the bucket',
      path,
      size,
      bucket: this.bucket,
      useMultipartUpload,
    });

    const readable = createReadStream(absolutePath);
    const fn = useMultipartUpload ? this.environment.uploadMultipartFile.bind(this.environment) : this.environment.upload;

    return uploadFile({
      fn,
      bucket: this.bucket,
      readable,
      size,
      absolutePath,
      path,
      callbacks,
      abortSignal,
    });
  }

  async run(props: TProps) {
    return await limiter.schedule(() => this.upload(props));
  }
}
