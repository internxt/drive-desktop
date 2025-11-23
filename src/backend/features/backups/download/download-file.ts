import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { pipeline } from '@/core/utils/pipeline';
import { InxtJs } from '@/infra';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Effect } from 'effect/index';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';

type Props = {
  file: ExtendedDriveFile;
  contentsDownloader: InxtJs.ContentsDownloader;
};

export function downloadFile({ file, contentsDownloader }: Props) {
  return Effect.gen(function* () {
    logger.debug({ tag: 'BACKUPS', msg: 'Download file', path: file.absolutePath });

    const parentPath = dirname(file.absolutePath);

    yield* Effect.promise(() => mkdir(parentPath, { recursive: true }));

    const writable = createWriteStream(file.absolutePath);

    const readable = yield* Effect.promise(() =>
      contentsDownloader.downloadThrow({
        path: file.absolutePath,
        contentsId: file.contentsId,
      }),
    );

    yield* pipeline({ readable, writable });
  }).pipe(
    Effect.catchTag('PipelineAborted', () => {
      return Effect.void;
    }),
    Effect.catchAllCause((error) => {
      logger.error({ tag: 'BACKUPS', msg: 'Error downloading file', path: file.absolutePath, error });
      return Effect.void;
    }),
  );
}
