import { Readable } from 'node:stream';
import { ActionState } from '@internxt/inxt-js/build/api';
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

  download({ file, path, onProgress }: { file: SimpleDriveFile; path: string; onProgress: (progress: number) => void }) {
    ipcRendererSyncEngine.send('FILE_DOWNLOADING', { path, progress: 0 });

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
