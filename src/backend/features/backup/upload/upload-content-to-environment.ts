import { Environment } from '@internxt/inxt-js';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { MULTIPART_UPLOAD_SIZE_THRESHOLD } from '../../../../context/shared/domain/UploadConstants';
import { createReadStream } from 'node:fs';
import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
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
    const uploadFn: UploadStrategyFunction =
      size > MULTIPART_UPLOAD_SIZE_THRESHOLD
        ? environment.uploadMultipartFile.bind(environment)
        : environment.upload.bind(environment);

    const accessResult = await safeAccess({ absolutePath: path });
    if (accessResult.error) {
      return { error: accessResult.error };
    }

    const readable = createReadStream(path);

    return new Promise<Result<string, DriveDesktopError>>((resolve) => {
      let settled = false;
      const resolveOnce = (result: Result<string, DriveDesktopError>) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      readable.on('error', (err: Error & { code?: unknown; status?: unknown }) => {
        logger.error({ tag: 'BACKUPS', msg: '[ENVLFU READ STREAM ERROR]', err, path });
        resolveOnce({ error: mapEnvironmentUploadError(err) });
      });

      const state = uploadFn(bucket, {
        source: readable,
        fileSize: size,
        finishedCallback: (err, contentsId) => {
          readable.close();

          if (err) {
            logger.error({ tag: 'BACKUPS', msg: '[ENVLFU UPLOAD ERROR]', err });
            return resolveOnce({ error: mapEnvironmentUploadError(err) });
          }

          if (!contentsId) {
            logger.error({ tag: 'BACKUPS', msg: '[ENVLFU UPLOAD ERROR] No contentsId returned' });
            return resolveOnce({ error: new DriveDesktopError('UNKNOWN') });
          }

          resolveOnce({ data: contentsId });
        },
        progressCallback: (progress: number) => {
          logger.debug({ tag: 'SYNC-ENGINE', msg: '[UPLOAD PROGRESS]', progress });
        },
      });

      signal.addEventListener(
        'abort',
        () => {
          state.stop();
          readable.destroy();
        },
        { once: true },
      );
    });
  } catch (err) {
    if (isError(err)) {
      return { error: mapEnvironmentUploadError(err) };
    }
    return { error: new DriveDesktopError('UNKNOWN') };
  }
}
