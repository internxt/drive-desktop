import { CommonContext } from '@/apps/sync-engine/config';
import { LocalSync } from '@/backend/features';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { sendRequest, uploadFile } from './upload-file';

type TProps = {
  ctx: CommonContext;
  path: AbsolutePath;
  size: number;
};

export async function environmentFileUpload({ ctx, path, size }: TProps) {
  function onAbort() {
    ctx.logger.debug({ msg: 'Aborting upload', path });
    sendRequest({ type: 'abort', path });
  }

  ctx.abortController.signal.addEventListener('abort', onAbort);

  LocalSync.SyncState.addItem({ action: 'UPLOADING', path, progress: 0 });

  const contentsId = await uploadFile({ ctx, size, path });

  ctx.abortController.signal.removeEventListener('abort', onAbort);

  return contentsId;
}
