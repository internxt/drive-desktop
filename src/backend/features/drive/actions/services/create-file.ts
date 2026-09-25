import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { Sync } from '@/backend/features/sync';
import { getCreateFileKey, getInFlightRequest } from '@/infra/drive-server-wip/in/get-in-flight-request';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Addon } from '@/node-win/addon-wrapper';
import { waitForLocalFile } from './wait-for-local-file';

type Props = {
  ctx: SyncContext;
  path: AbsolutePath;
  parentUuid: FolderUuid;
};

export async function createFile({ ctx, path, parentUuid }: Props) {
  try {
    const key = getCreateFileKey({ path });
    const promiseFn = async () => {
      const { error } = await waitForLocalFile({ ctx, path, retry: () => retryCreateFile({ ctx, path, parentUuid }) });
      if (error) return;

      return await Sync.Actions.createFile({ ctx, path, parentUuid });
    };
    const { promise, reused } = getInFlightRequest({ key, promiseFn });

    if (reused) {
      /**
       * v2.6.9 Daniel Jiménez
       * When a user copies (not moves, copies) a folder with many files inside, the create
       * events of the files are delayed in the watcher since the copy takes time. What can
       * happen in this case is that the create events of those files are not ignored and are
       * processed trying to create the files twice. If we detect that the create file promise
       * is already happening, we ignore the new event.
       */
      ctx.logger.debug({ msg: 'Create file event duplicated, ignore this one', path });
      return;
    }

    const file = await promise;

    if (!file) return;

    await Addon.convertToPlaceholder({ path, placeholderId: `FILE:${file.uuid}` });
  } catch (error) {
    ctx.logger.error({ msg: 'Error creating file', path, error });
  }
}

async function retryCreateFile({ ctx, path, parentUuid }: Props) {
  const { error } = await NodeWin.getFileInfo({ path });
  if (error?.code !== 'NOT_A_PLACEHOLDER') return;

  await createFile({ ctx, path, parentUuid });
}
