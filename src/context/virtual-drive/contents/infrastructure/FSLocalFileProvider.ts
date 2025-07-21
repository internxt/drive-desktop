import Logger from 'electron-log';
import { createReadStream, promises as fs, watch } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { logger } from '@/apps/shared/logger/logger';

export class FSLocalFileProvider {
  private static readonly TIMEOUT_BUSY_CHECK = 10_000;
  private reading = new Map<string, AbortController>();

  private async untilIsNotBusy(filePath: string, retriesLeft = 5): Promise<void> {
    let isResolved = false;

    const attemptRead = () => {
      try {
        const readable = createReadStream(filePath);

        return new Promise<void>((resolve, reject) => {
          readable.once('data', () => {
            isResolved = true;
            readable.close();
            resolve();
          });

          readable.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EBUSY' && retriesLeft > 0 && !isResolved) {
              Logger.debug(
                `File is busy, will wait ${FSLocalFileProvider.TIMEOUT_BUSY_CHECK} ms and try it again. Retries left: ${retriesLeft}`,
              );
              setTimeout(async () => {
                await attemptRead();
                // TODO: perhaps, we should reject here when isResolved is false
                resolve();
              }, FSLocalFileProvider.TIMEOUT_BUSY_CHECK);
            } else {
              reject(err);
            }
          });
        });
      } catch (error) {
        Logger.error(`Error reading file: ${error}`);
        throw error;
      }
    };

    await attemptRead();
  }

  private async createAbortableStream(filePath: string): Promise<{
    readable: Readable;
    controller: AbortController;
  }> {
    const isBeingRead = this.reading.get(filePath);

    if (isBeingRead) {
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'File is being read, aborting previous read',
        filePath,
      });
      isBeingRead.abort();
    }

    await this.untilIsNotBusy(filePath);
    const readStream = createReadStream(filePath);
    const controller = new AbortController();

    this.reading.set(filePath, controller);

    return { readable: readStream, controller };
  }

  async provide(absoluteFilePath: string) {
    try {
      const { readable, controller } = await this.createAbortableStream(absoluteFilePath);

      const { size, mtimeMs } = await fs.stat(absoluteFilePath);

      const absoluteFolderPath = path.dirname(absoluteFilePath);
      const nameWithExtension = path.basename(absoluteFilePath);

      const watcher = watch(absoluteFolderPath, async (event, filename) => {
        if (filename !== nameWithExtension) {
          return;
        }

        try {
          const { mtimeMs: newMtimeMs, size: newSize } = await fs.stat(absoluteFilePath);

          if (newMtimeMs !== mtimeMs || newSize !== size) {
            logger.debug({
              msg: 'File changed, aborting read stream',
              filePath: absoluteFilePath,
              filename,
              nameWithExtension,
              event,
              newMtimeMs,
              newSize,
            });

            controller.abort();
          } else {
            logger.debug({
              msg: 'File event detected, but no real changes found',
              filePath: absoluteFilePath,
              filename,
              nameWithExtension,
              event,
            });
          }
        } catch (error) {
          logger.error({
            msg: 'Error while checking file changes',
            exc: error,
            filePath: absoluteFilePath,
          });
        }
      });

      readable.on('end', () => {
        watcher.close();
        this.reading.delete(absoluteFilePath);
      });

      readable.on('close', () => {
        this.reading.delete(absoluteFilePath);
      });

      return {
        readable,
        size,
        abortSignal: controller.signal,
      };
    } catch (error) {
      Logger.error(`Error providing file: ${error}`);
      throw error;
    }
  }
}
