import Logger from 'electron-log';
import { createReadStream, promises as fs, watch } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { LocalFileContents } from '../domain/LocalFileContents';
import { logger } from '@/apps/shared/logger/logger';

function extractNameAndExtension(nameWithExtension: string): [string, string] {
  if (nameWithExtension.startsWith('.')) {
    return [nameWithExtension, ''];
  }

  const [name, extension] = nameWithExtension.split('.');

  return [name, extension];
}

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

          readable.on('error', (err: Error) => {
            const busyErrorCodes = ['EBUSY', 'EPERM', 'EACCES', 'ENOENT'];
            const isBusyError =
              busyErrorCodes.includes((err as any).code || '') || err.message.includes('busy') || err.message.includes('access denied');

            if (isBusyError && retriesLeft > 0 && !isResolved) {
              Logger.debug(
                `File is busy (${(err as any).code || 'BUSY'}), will wait ${FSLocalFileProvider.TIMEOUT_BUSY_CHECK} ms and try it again. Retries left: ${retriesLeft}`,
              );
              setTimeout(async () => {
                try {
                  await attemptRead();
                  resolve();
                } catch (retryError) {
                  reject(retryError);
                }
              }, FSLocalFileProvider.TIMEOUT_BUSY_CHECK);
            } else {
              throw logger.error({
                tag: 'SYNC-ENGINE',
                msg: 'File read error during busy check',
                exc: err,
                context: {
                  filePath,
                  syscall: (err as any).syscall,
                  path: (err as any).path,
                  retriesLeft,
                  errorCode: (err as any).code,
                },
              });
            }
          });
        });
      } catch (error) {
        throw logger.error({
          tag: 'SYNC-ENGINE',
          msg: 'Error reading file during busy check',
          exc: error,
          context: { filePath },
        });
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
        context: { filePath },
      });
      isBeingRead.abort();
    }

    await this.untilIsNotBusy(filePath);
    const readStream = createReadStream(filePath);
    const controller = new AbortController();

    // Agregar manejo de errores al stream final
    readStream.on('error', (err: Error) => {
      throw logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Stream read error',
        exc: err,
        context: {
          filePath,
          syscall: (err as any).syscall,
          path: (err as any).path,
          errorCode: (err as any).code,
        },
      });
    });

    this.reading.set(filePath, controller);

    return { readable: readStream, controller };
  }

  async provide(absoluteFilePath: string) {
    try {
      const { readable, controller } = await this.createAbortableStream(absoluteFilePath);

      const { size, mtimeMs, birthtimeMs } = await fs.stat(absoluteFilePath);

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
              tag: 'SYNC-ENGINE',
              msg: 'File changed, aborting read stream',
              context: {
                filePath: absoluteFilePath,
                filename,
                nameWithExtension,
                event,
                newMtimeMs,
                newSize,
              },
            });

            controller.abort();
          } else {
            logger.debug({
              tag: 'SYNC-ENGINE',
              msg: 'File event detected, but no real changes found',
              context: {
                filePath: absoluteFilePath,
                filename,
                nameWithExtension,
                event,
              },
            });
          }
        } catch (error) {
          logger.error({
            tag: 'SYNC-ENGINE',
            msg: 'Error while checking file changes',
            exc: error,
            context: { filePath: absoluteFilePath },
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

      const [name, extension] = extractNameAndExtension(nameWithExtension);

      const contents = LocalFileContents.from({
        name,
        extension,
        size,
        modifiedTime: mtimeMs,
        birthTime: birthtimeMs,
        contents: readable,
      });

      return {
        contents,
        abortSignal: controller.signal,
      };
    } catch (error) {
      throw logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error providing file',
        exc: error,
        context: { filePath: absoluteFilePath },
      });
    }
  }
}
