import { Environment } from '@internxt/inxt-js';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { createReadStream } from 'node:fs';
import { Result } from '../../../../context/shared/domain/Result';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { isError } from '../../../../shared/errors/is-error';
import { safeAccess } from '../../../../infra/local-file-system/safe-access';
import { mapEnvironmentUploadError } from '../../../../backend/common/rate-limit/transient-error-handler';

export type ContentUploadParams = {
  path: string;
  size: number;
  bucket: string;
  environment: Environment;
  signal: AbortSignal;
};

export async function uploadContentToEnvironment({
  path,
  size,
  bucket,
  environment,
  signal,
}: ContentUploadParams): Promise<Result<string, DriveDesktopError>> {
  try {
    const accessResult = await safeAccess({ absolutePath: path });
    if (accessResult.error) {
      return { error: accessResult.error };
    }

    const readable = createReadStream(path);
    const abortHandler = () => {
      readable.destroy();
    };

    readable.on('error', (err: Error & { code?: unknown; status?: unknown }) => {
      logger.error({ tag: 'BACKUPS', msg: '[ENVLFU READ STREAM ERROR]', err, path });
    });

    signal.addEventListener('abort', abortHandler, { once: true });

    try {
      const contentsId = await environment.upload(bucket, {
        source: readable,
        fileSize: size,
        abortSignal: signal,
        progressCallback: (progress: number) => {
          logger.debug({ tag: 'SYNC-ENGINE', msg: '[UPLOAD PROGRESS]', progress });
        },
      });

      if (!contentsId) {
        logger.error({ tag: 'BACKUPS', msg: '[ENVLFU UPLOAD ERROR] No contentsId returned' });
        return { error: new DriveDesktopError('UNKNOWN') };
      }

      return { data: contentsId };
    } catch (err) {
      logger.error({ tag: 'BACKUPS', msg: '[ENVLFU UPLOAD ERROR]', err });

      if (isError(err)) {
        return { error: mapEnvironmentUploadError(err) };
      }

      return { error: new DriveDesktopError('UNKNOWN') };
    } finally {
      signal.removeEventListener('abort', abortHandler);

      if (!readable.destroyed) {
        readable.close();
      }
    }
  } catch (err) {
    if (isError(err)) {
      return { error: mapEnvironmentUploadError(err) };
    }
    return { error: new DriveDesktopError('UNKNOWN') };
  }
}
