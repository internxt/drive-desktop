import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { SyncContext } from '@/apps/sync-engine/config';
import { Sync } from '@/backend/features/sync';
import { getInFlightRequest, getReplaceFileKey } from '@/infra/drive-server-wip/in/get-in-flight-request';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Addon } from '@/node-win/addon-wrapper';
import { InSyncState } from '@/node-win/types/placeholder.type';
import { waitForLocalFile } from './wait-for-local-file';

type Props = {
  ctx: SyncContext;
  path: AbsolutePath;
  uuid: FileUuid;
};

export async function replaceFile({ ctx, path, uuid }: Props) {
  try {
    const key = getReplaceFileKey({ path });
    const promiseFn = async () => {
      const { error } = await waitForLocalFile({ ctx, path, retry: () => retryReplaceFile({ ctx, path, uuid }) });
      if (error) return;

      return await Sync.Actions.replaceFile({ ctx, path, uuid });
    };
    const { promise, reused } = getInFlightRequest({ key, promiseFn });

    if (reused) {
      /**
       * v2.7.0 Victor Fernandez
       * While a big file is being overwritten the watcher can emit several events for it. Now that we
       * wait until the copy finishes, each of those events would wait in parallel and upload the same
       * file once the copy ends, so we ignore the events that arrive while one is already in flight.
       */
      ctx.logger.debug({ msg: 'Replace file event duplicated, ignore this one', path });
      return;
    }

    const file = await promise;

    if (!file) return;

    await Addon.updateSyncStatus({ path });
  } catch (error) {
    ctx.logger.error({ msg: 'Error replacing file', path, error });
  }
}

async function retryReplaceFile({ ctx, path, uuid }: Props) {
  const { data: fileInfo } = await NodeWin.getFileInfo({ path });
  if (fileInfo?.inSyncState !== InSyncState.NotSync) return;

  await replaceFile({ ctx, path, uuid });
}
