import { Readable } from 'node:stream';
import { ActionState } from '@internxt/inxt-js/build/api';
import { logger } from '@/apps/shared/logger/logger';
import { Environment } from '@internxt/inxt-js';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

export type Resolve = (_: { data: Readable; error?: undefined } | { data?: undefined; error: Error | null }) => void;

export class EnvironmentContentFileDownloader {
  private state: ActionState | null;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {
    this.state = null;
  }

  forceStop() {
    if (this.state) {
      this.environment.downloadCancel(this.state);
    }
  }

  download({ file, onProgress }: { file: SimpleDriveFile; onProgress: (progress: number) => void }) {
    ipcRendererSyncEngine.send('FILE_DOWNLOADING', { key: file.uuid, nameWithExtension: file.nameWithExtension, progress: 0 });

    return new Promise((resolve: Resolve) => {
      this.state = this.environment.download(
        this.bucket,
        file.contentsId,
        {
          progressCallback: (progress) => onProgress(progress),
          finishedCallback: (error, stream) => {
            if (stream) {
              return resolve({ data: stream });
            }

            logger.error({ msg: 'Error downloading file', error });
            ipcRendererSyncEngine.send('FILE_DOWNLOAD_ERROR', { key: file.uuid, nameWithExtension: file.nameWithExtension });
            return resolve({ error });
          },
        },
        {
          label: 'Dynamic',
          params: {
            useProxy: false,
            chunkSize: 4 * 1024 * 1024,
          },
        },
      );
    });
  }
}
