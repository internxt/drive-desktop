import { createReadStream, promises as fs, watch } from 'fs';
import { basename, dirname } from 'path';
import { Readable } from 'stream';
import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { untilIsNotBusy } from './until-is-not-busy';

type Props = {
  path: string;
  absolutePath: AbsolutePath;
};

export class FSLocalFileProvider {
  private reading = new Map<AbsolutePath, AbortController>();

  private async createAbortableStream({ path, absolutePath }: Props): Promise<{
    readable: Readable;
    controller: AbortController;
  }> {
    const isBeingRead = this.reading.get(absolutePath);

    if (isBeingRead) {
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'File is being read, aborting previous read',
        path,
      });
      isBeingRead.abort();
    }

    await untilIsNotBusy({ absolutePath });
    const readStream = createReadStream(absolutePath);
    const controller = new AbortController();

    readStream.on('error', (err) => {
      throw logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Stream read error',
        exc: err,
        path,
      });
    });

    this.reading.set(absolutePath, controller);

    return { readable: readStream, controller };
  }

  async provide({ path, absolutePath }: Props) {
    try {
      const { readable, controller } = await this.createAbortableStream({ path, absolutePath });

      const { size, mtimeMs } = await fs.stat(absolutePath);

      const absoluteFolderPath = dirname(absolutePath);
      const nameWithExtension = basename(absolutePath);

      const watcher = watch(absoluteFolderPath, async (event, filename) => {
        if (filename !== nameWithExtension) {
          return;
        }

        try {
          const { mtimeMs: newMtimeMs, size: newSize } = await fs.stat(absolutePath);

          if (newMtimeMs !== mtimeMs || newSize !== size) {
            logger.debug({
              tag: 'SYNC-ENGINE',
              msg: 'File changed, aborting read stream',
              path,
              event,
              newMtimeMs,
              newSize,
            });

            controller.abort();
          } else {
            logger.debug({
              tag: 'SYNC-ENGINE',
              msg: 'File event detected, but no real changes found',
              path,
              event,
            });
          }
        } catch (exc) {
          logger.error({
            tag: 'SYNC-ENGINE',
            msg: 'Error while checking file changes',
            path,
            exc,
          });
        }
      });

      readable.on('end', () => {
        watcher.close();
        this.reading.delete(absolutePath);
      });

      readable.on('close', () => {
        this.reading.delete(absolutePath);
      });

      return {
        readable,
        size,
        abortSignal: controller.signal,
      };
    } catch (exc) {
      throw logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error providing file',
        path,
        exc,
      });
    }
  }
}
