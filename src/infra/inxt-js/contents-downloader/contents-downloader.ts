import { AbsolutePath, logger, throwWrapper } from '@internxt/drive-desktop-core/build/backend';
import { Environment } from '@internxt/inxt-js';
import { ActionState } from '@internxt/inxt-js/build/api';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { LocalSync } from '@/backend/features';

const downloads = new Map<AbsolutePath, ActionState>();

type Resolve = (_: { data: AsyncIterable<Buffer>; error?: undefined } | { data?: undefined; error: Error }) => void;

export class ContentsDownloader {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  forceStop({ path }: { path: AbsolutePath }) {
    const state = downloads.get(path);

    if (state) {
      logger.debug({ msg: 'Cancel download', path });
      this.environment.downloadCancel(state);
      downloads.delete(path);
    }
  }

  download({ path, contentsId }: { path: AbsolutePath; contentsId: ContentsId }) {
    LocalSync.SyncState.addItem({ action: 'DOWNLOADING', path, progress: 0 });

    return new Promise((resolve: Resolve) => {
      const state = this.environment.download(
        this.bucket,
        contentsId,
        {
          progressCallback: (progress) => {
            LocalSync.SyncState.addItem({ action: 'DOWNLOADING', path, progress });
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
            chunkSize: 256 * 1024,
          },
        },
      );

      downloads.set(path, state);
    });
  }

  downloadThrow = throwWrapper(this.download.bind(this));
}
