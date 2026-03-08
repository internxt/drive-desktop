import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath, dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { moveFile } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-file';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { Drive } from '@/backend/features/drive';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { basename } from 'node:path';
import { Addon } from '@/node-win/addon-wrapper';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function onAdd({ ctx, path }: TProps) {
  try {
    const { data: fileInfo } = await NodeWin.getFileInfo({ path });

    if (fileInfo) {
      await moveFile({ ctx, path, uuid: fileInfo.uuid });
      return;
    }

    const { data: parentInfo } = await NodeWin.getFolderInfo({ ctx, path: dirname(path) });

    if (parentInfo) {
      const nameWithExtension = basename(path);
      const parentUuid = parentInfo.uuid;

      /**
       * v2.6.7 Daniel Jiménez
       * Here we need to catch an edge case. When we update a text file because we add content to it,
       * we receive an `update` event and we can replace the file in cloud. However, most apps don't
       * work like that. When you modify a `.png` in Paint and then you save it, what happens is that
       * the file gets deleted and a new file is created in that position, receiving a `create` event.
       * But, since the old file has been deleted we lose the placeholder, so we need to check in the
       * sqlite if that file already exists so we can reuse the id.
       */
      const { data: file } = await SqliteModule.FileModule.getByName({ parentUuid, nameWithExtension });

      if (file) {
        await Addon.convertToPlaceholder({ path, placeholderId: `FILE:${file.uuid}` });
        await Drive.Actions.replaceFile({ ctx, path, uuid: file.uuid });
      } else {
        await Drive.Actions.createFile({ ctx, path, parentUuid });
      }
    }
  } catch (error) {
    ctx.logger.error({ msg: 'Error on add event', path, error });
  }
}
