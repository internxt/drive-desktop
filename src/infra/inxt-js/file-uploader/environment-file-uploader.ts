import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createReadStream } from 'node:fs';
import { uploadFile } from './upload-file';
import { LocalSync } from '@/backend/features';
import { CommonContext } from '@/apps/sync-engine/config';

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

  const readable = createReadStream(path);
  const contentsId = await uploadFile({ ctx, readable, size, path, abortController });

  readable.close();
  ctx.abortController.signal.removeEventListener('abort', onAbort);

  return contentsId;
}
