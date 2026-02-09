import { BackupsContext } from '../BackupInfo';
import { RemoteTree } from '../remote-tree/traverser';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Sync } from '@/backend/features/sync';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { scheduleRequest } from '../schedule-request';

type TProps = {
  ctx: BackupsContext;
  added: Array<AbsolutePath>;
  tree: RemoteTree;
};

export async function createFolders({ ctx, added, tree }: TProps) {
  const sortedAdded = added.toSorted((a, b) => a.localeCompare(b));

  for (const path of sortedAdded) {
    try {
      await scheduleRequest({ ctx, path, fn: () => createFolder(ctx, path, tree) });
    } catch (error) {
      ctx.logger.error({ msg: 'Error creating folder', path, error });
    }
  }
}

async function createFolder(ctx: BackupsContext, path: AbsolutePath, tree: RemoteTree) {
  const parentPath = pathUtils.dirname(path);
  const parent = tree.folders.get(parentPath);

  if (!parent) return;

  const folder = await Sync.Actions.createFolder({ ctx, path, parentUuid: parent.uuid });

  if (!folder) return;

  tree.folders.set(path, { ...folder, absolutePath: path });
}
