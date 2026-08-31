import { CommonContext } from '@/apps/sync-engine/config';
import { LocalSync } from '@/backend/features';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { uploadFile } from './upload-file';

type TProps = {
  ctx: CommonContext;
  path: AbsolutePath;
  size: number;
};

export async function environmentFileUpload({ ctx, path, size }: TProps) {
  const abortController = new AbortController();

  function onAbort() {
    ctx.logger.debug({ msg: 'Aborting upload', path });
    abortController.abort();
  }

  ctx.abortController.signal.addEventListener('abort', onAbort);

  LocalSync.SyncState.addItem({ action: 'UPLOADING', path, progress: 0 });

  try {
    return await uploadFile({ ctx, size, path, abortController });
  } finally {
    ctx.abortController.signal.removeEventListener('abort', onAbort);
  }
}
