import { join } from 'node:path';
import { cwd } from 'node:process';
import { Worker } from 'node:worker_threads';
import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { sleep } from '@/apps/main/util';
import { CommonContext } from '@/apps/sync-engine/config';
import { LocalSync } from '@/backend/features';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { ErrorResponse, ProgressResponse, WorkerRequest, WorkerResponse } from './worker-defs';

type Props = {
  ctx: CommonContext;
  size: number;
  path: AbsolutePath;
  retry?: number;
  sleepMs?: number;
};

const worker = new Worker(join(cwd(), 'dist/main/worker.js'));

export function sendRequest(m: WorkerRequest) {
  worker.postMessage(m);
}

export async function uploadFile({ ctx, size, path, retry = 1, sleepMs = 5000 }: Props) {
  ctx.logger.debug({
    msg: 'Uploading file to the bucket',
    path,
    size,
    bucket: ctx.bucket,
    ...(retry > 1 && { retry }),
  });

  async function onProgress({ progress }: ProgressResponse) {
    const { data: stats } = await fileSystem.stat({ absolutePath: path });

    if (stats && stats.size !== size) {
      ctx.logger.debug({ msg: 'File size changed during upload', path, oldSize: size, newSize: stats.size });
      sendRequest({ type: 'abort', path });
      return;
    }

    LocalSync.SyncState.addItem({ action: 'UPLOADING', path, progress });
  }

  return await new Promise<ContentsId | undefined>((resolve) => {
    async function onError({ code, error }: ErrorResponse) {
      if (code === 'ABORTED') return;

      ctx.logger.error({ msg: 'Failed to upload file to the bucket', path, error });
      LocalSync.SyncState.addItem({ action: 'UPLOAD_ERROR', path });

      if (code === 'MAX_SPACE_USED') {
        addGeneralIssue({ error: 'NOT_ENOUGH_SPACE', name: path });
      } else if (code === 'SERVER') {
        addGeneralIssue({ error: 'SERVER_INTERNAL_ERROR', name: path });
        await sleep(sleepMs);
        resolve(
          await uploadFile({
            ctx,
            size,
            path,
            retry: retry + 1,
            sleepMs: sleepMs * 2,
          }),
        );
      }
    }

    async function onMessage(r: WorkerResponse) {
      if (path !== r.path) return;

      switch (r.type) {
        case 'progress':
          await onProgress(r);
          break;
        case 'success':
          worker.off('message', onMessage);
          resolve(r.contentsId);
          break;
        case 'error':
          worker.off('message', onMessage);
          await onError(r);
          break;
      }
    }

    worker.on('message', onMessage);

    sendRequest({ type: 'upload', path, size, bucketId: ctx.bucket, config: ctx.environmentConfig });
  });
}
