import { SyncContext } from './config';
import { Traverser } from '@/context/virtual-drive/items/application/Traverser';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type Props = {
  ctx: SyncContext;
  isFirstExecution: boolean;
};

export async function refreshItemPlaceholders({ ctx, isFirstExecution }: Props) {
  try {
    const startTime = performance.now();

    ctx.logger.debug({ msg: 'Refresh item placeholders', isFirstExecution });

    const items = await getAllItems({ ctx });
    const currentFolder = { absolutePath: ctx.rootPath, uuid: ctx.rootUuid };
    await Traverser.run({ ctx, currentFolder, items, isFirstExecution });

    const endTime = performance.now();

    ctx.logger.debug({ msg: 'Finish refreshing placeholders in seconds', time: (endTime - startTime) / 1000 });
  } catch (error) {
    ctx.logger.error({ msg: 'Error refreshing item placeholders', error });
  }
}

async function getAllItems({ ctx }: { ctx: SyncContext }) {
  const [{ data: files = [] }, { data: folders = [] }] = await Promise.all([
    SqliteModule.FileModule.getByWorkspaceId({ ...ctx }),
    SqliteModule.FolderModule.getByWorkspaceId({ ...ctx }),
  ]);

  return { files, folders };
}
