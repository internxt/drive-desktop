import { loadInMemoryPaths } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { SyncContext } from './config';
import { traverse } from '@/context/virtual-drive/items/application/Traverser';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { measurePerfomance } from '@/core/utils/measure-performance';

type Props = {
  ctx: SyncContext;
  isFirstExecution: boolean;
};

export async function refreshItemPlaceholders({ ctx, isFirstExecution }: Props) {
  try {
    ctx.logger.debug({ msg: 'Refresh item placeholders', isFirstExecution });

    const time = await measurePerfomance(async () => {
      const [database, fileExplorer] = await Promise.all([getDatabaseItems({ ctx }), loadInMemoryPaths({ ctx })]);

      const currentFolder = { absolutePath: ctx.rootPath, uuid: ctx.rootUuid };

      await traverse({ ctx, currentFolder, database, fileExplorer, isFirstExecution });
    });

    ctx.logger.debug({ msg: 'Finish refresh placeholders in seconds', time });
  } catch (error) {
    ctx.logger.error({ msg: 'Error refreshing item placeholders', error });
  }
}

async function getDatabaseItems({ ctx }: { ctx: SyncContext }) {
  const [{ data: files = [] }, { data: folders = [] }] = await Promise.all([
    SqliteModule.FileModule.getByWorkspaceId({ ...ctx }),
    SqliteModule.FolderModule.getByWorkspaceId({ ...ctx }),
  ]);

  return { files, folders };
}
