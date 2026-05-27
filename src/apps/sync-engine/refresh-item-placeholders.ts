import pLimit from 'p-limit';
import { loadInMemoryPaths } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { traverse } from '@/context/virtual-drive/items/application/Traverser';
import { measurePerfomance } from '@/core/utils/measure-performance';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { SyncContext } from './config';

type Props = {
  ctx: SyncContext;
  isFirstExecution: boolean;
};

export async function refreshItemPlaceholders({ ctx, isFirstExecution }: Props) {
  try {
    const time = await measurePerfomance(async () => {
      const [database, fileExplorer] = await Promise.all([getDatabaseItems({ ctx }), loadInMemoryPaths({ ctx })]);

      ctx.logger.debug({
        msg: 'Refresh item placeholders',
        isFirstExecution,
        database: {
          files: database.files.length,
          folders: database.folders.length,
        },
        fileExplorer: {
          files: fileExplorer.files.size,
          folders: fileExplorer.folders.size,
        },
      });

      const currentFolder = { absolutePath: ctx.rootPath, uuid: ctx.rootUuid };

      await traverse({ ctx, currentFolder, database, fileExplorer, isFirstExecution, limit: pLimit(20) });
    });

    ctx.logger.debug({ msg: 'Finish refresh placeholders in seconds', time });
  } catch (error) {
    ctx.logger.error({ msg: 'Error refreshing item placeholders', error });
  }
}

async function getDatabaseItems({ ctx }: { ctx: SyncContext }) {
  /**
   * v2.6.9 Daniel Jiménez
   * Here there is an issue because we are loading all items for that workspace.
   * In case of non worspace (empty) we load all drive items and also the ones from backups.
   * This is happening because we don't have a way of differenciate drive and backup items.
   */
  const [{ data: files = [] }, { data: folders = [] }] = await Promise.all([
    SqliteModule.FileModule.getByWorkspaceId({ ...ctx }),
    SqliteModule.FolderModule.getByWorkspaceId({ ...ctx }),
  ]);

  return { files, folders };
}
