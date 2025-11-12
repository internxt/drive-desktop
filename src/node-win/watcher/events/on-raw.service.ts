import { detectContextMenuAction } from '../detect-context-menu-action.service';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: ProcessSyncContext;
  event: string;
  path: AbsolutePath;
  details: any;
};

export async function onRaw({ ctx, event, path, details }: TProps) {
  if (event === 'change' && details.prev && details.curr) {
    try {
      const { data, error } = await fileSystem.stat({ absolutePath: path });

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

      await detectContextMenuAction({ ctx, details, path });
    } catch (error) {
      ctx.logger.error({ msg: 'Error on change event', path, error });
    }
  }
}
