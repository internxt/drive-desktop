import { ActionState } from '@internxt/inxt-js/build/api';
import { Environment } from '@internxt/inxt-js';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';

type Resolve = (_: { data: AsyncIterable<Buffer>; error?: undefined } | { data?: undefined; error: Error | null }) => void;

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

  download({ contentsId, onProgress }: { contentsId: ContentsId; onProgress: (progress: number) => void }) {
    return new Promise((resolve: Resolve) => {
      this.state = this.environment.download(
        this.bucket,
        contentsId,
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
