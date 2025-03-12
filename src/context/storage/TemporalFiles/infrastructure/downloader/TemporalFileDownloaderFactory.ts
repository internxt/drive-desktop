import { Environment } from '@internxt/inxt-js';
import { Service } from 'diod';
import Logger from 'electron-log';
import { Readable } from 'stream';
import { UploadProgressTracker } from '../../../../shared/domain/UploadProgressTracker';
import { EnvironmentTemporalFileUploader } from '../upload/EnvironmentTemporalFileUploader';
import { TemporalFileUploaderFactory } from '../../domain/upload/TemporalFileUploaderFactory';
import { Replaces } from '../../domain/upload/Replaces';
import { TemporalFile } from '../../domain/TemporalFile';

@Service()
export class TemporalFileDownloaderFactory
  implements TemporalFileUploaderFactory
{
  private _readable: Readable | undefined = undefined;
  private _file: TemporalFile | undefined = undefined;
  private _replaces: Replaces | undefined = undefined;
  private _abortController: AbortController | undefined = undefined;

  private static MULTIPART_UPLOAD_SIZE_THRESHOLD = 100 * 1024 * 1024; // 100MB

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
    private readonly progressTracker: UploadProgressTracker
  ) {}

  private registerEvents(uploader: EnvironmentTemporalFileUploader) {
    if (!this._file) {
      return;
    }

    const name = this._replaces ? this._replaces.name : this._file.path.name();
    const extension = this._replaces
      ? this._replaces.extension
      : this._file.path.extension();

    const size = this._file.size.value;

    uploader.on('start', () => {
      this.progressTracker.uploadStarted(name, extension, size);
    });

    uploader.on('progress', (progress: number) => {
      this.progressTracker.uploadProgress(name, extension, size, {
        elapsedTime: uploader.elapsedTime(),
        percentage: progress,
      });
    });

    uploader.on('error', (error: Error) => {
      // TODO: use error to determine the cause
      Logger.error('[TFDF ERROR]', error);
      this.progressTracker.uploadError(name, extension, 'UNKNOWN');
    });

    uploader.on('finish', () => {
      this.progressTracker.uploadCompleted(name, extension, size, {
        elapsedTime: uploader.elapsedTime(),
      });
    });
  }

  read(readable: Readable) {
    this._readable = readable;

    return this;
  }

  document(document: TemporalFile) {
    this._file = document;

    return this;
  }

  replaces(r?: Replaces) {
    this._replaces = r;

    return this;
  }

  abort(controller?: AbortController) {
    this._abortController = controller;

    return this;
  }

  build() {
    const document = this._file;
    const readable = this._readable;

    if (!document) {
      throw new Error('Size is needed to upload a file');
    }

    if (!readable) {
      throw new Error('Readable is needed to upload a file');
    }

    const fn =
      document.size.value >
      TemporalFileDownloaderFactory.MULTIPART_UPLOAD_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile
        : this.environment.upload;

    const uploader = new EnvironmentTemporalFileUploader(
      fn,
      this.bucket,
      this._abortController?.signal
    );

    this.registerEvents(uploader);

    return () => uploader.upload(readable, document.size.value);
  }
}
