import { ActionState } from '@internxt/inxt-js/build/api';
import { Environment } from '@internxt/inxt-js';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { AbsolutePath, logger, throwWrapper } from '@internxt/drive-desktop-core/build/backend';

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

  download({ path, contentsId, onProgress }: { path: AbsolutePath; contentsId: ContentsId; onProgress?: (progress: number) => void }) {
    return new Promise((resolve: Resolve) => {
      const state = this.environment.download(
        this.bucket,
        contentsId,
        {
          progressCallback: (progress) => onProgress?.(progress),
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

      downloads.set(path, state);
    });
  }

  downloadThrow = throwWrapper(this.download.bind(this));
}
