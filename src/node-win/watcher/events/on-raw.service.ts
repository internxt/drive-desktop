import { detectContextMenuAction } from '../detect-context-menu-action.service';
import { Watcher } from '../watcher';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: ProcessSyncContext;
  self: Watcher;
  event: string;
  absolutePath: AbsolutePath;
  details: any;
};

export async function onRaw({ ctx, self, event, absolutePath, details }: TProps) {
  if (event === 'change' && details.prev && details.curr) {
    const path = pathUtils.absoluteToRelative({
      base: self.virtualDrive.syncRootPath,
      path: absolutePath,
    });

    try {
      const { data, error } = await fileSystem.stat({ absolutePath });

      if (error) {
        /**
         * v2.5.6 Daniel Jiménez
         * When placeholder is deleted it also emits a change event, we want to ignore that error.
         */
        if (error.code === 'NON_EXISTS') return;
        throw error;
      }

      if (data.isDirectory()) {
        return;
      }

      await detectContextMenuAction({ ctx, self, details, absolutePath, path });
    } catch (error) {
      self.logger.error({ msg: 'Error on change event', path, error });
    }
  }
}
