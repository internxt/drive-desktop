import { BackupsContext } from '@/apps/backups/BackupInfo';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Sync } from '@/backend/features/sync';
import { StatItem } from '@/infra/file-system/services/stat-readdir';
import { scheduleRequest } from '../schedule-request';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  ctx: BackupsContext;
  remoteTree: RemoteTree;
  added: StatItem[];
};

export async function createFiles({ ctx, remoteTree, added }: Props) {
  await Promise.all(
    added.map(async (local) => {
      const path = local.path;

      try {
        await scheduleRequest({ ctx, path, fn: () => createFile(ctx, path, remoteTree) });
      } catch (error) {
        ctx.logger.error({ msg: 'Error creating file', path, error });
      }
    }),
  );
}

async function createFile(ctx: BackupsContext, path: AbsolutePath, remoteTree: RemoteTree) {
  const parentPath = dirname(path);
  const parent = remoteTree.folders.get(parentPath);

  if (!parent) return;

  await Sync.Actions.createFile({ ctx, path, parentUuid: parent.uuid });
}
