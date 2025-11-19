import { ActionState } from '@internxt/inxt-js/build/api';
import { Environment } from '@internxt/inxt-js';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type Resolve = (_: { data: AsyncIterable<Buffer>; error?: undefined } | { data?: undefined; error: Error }) => void;

export class ContentsDownloader {
  private state: ActionState | null = null;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  forceStop() {
    if (this.state) {
      this.environment.downloadCancel(this.state);
    }
  }

  download({ path, contentsId }: { path: AbsolutePath; contentsId: ContentsId }) {
    return new Promise((resolve: Resolve) => {
      this.state = this.environment.download(
        this.bucket,
        contentsId,
        {
          progressCallback: (progress) => {
            ipcRendererSyncEngine.send('FILE_DOWNLOADING', { path, progress });
          },
          finishedCallback: (error, stream) => {
            if (stream) {
              return resolve({ data: stream });
            }

            return resolve({ error: error ?? new Error('UNKNOWN') });
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
