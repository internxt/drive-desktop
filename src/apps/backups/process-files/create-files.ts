import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { stat } from 'node:fs/promises';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';
import { Sync } from '@/backend/features/sync';
import { getWorkerCount } from '@/core/utils/concurrency';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { StatItem } from '@/infra/file-system/services/stat-readdir';
import { scheduleRequest } from '../schedule-request';

type Props = {
  ctx: BackupsContext;
  remoteTree: RemoteTree;
  added: StatItem[];
};

const CREATE_FILES_CONCURRENCY = 20;

export async function createFiles({ ctx, remoteTree, added }: Props) {
  let nextIndex = 0;

  async function processNext() {
    while (nextIndex < added.length) {
      const local = added[nextIndex];
      nextIndex += 1;
      const path = local.path;

      try {
        await scheduleRequest({ ctx, path, fn: () => createFile(ctx, path, remoteTree) });
      } catch (error) {
        const fileStats = await stat(path).catch(() => null);

        ctx.logger.sentryError({ msg: 'Error creating file', path, error }, { fileSize: fileStats?.size });
      }
    }
  }

  const workerCount = getWorkerCount({ concurrency: CREATE_FILES_CONCURRENCY, itemCount: added.length });
  await Promise.all(Array.from({ length: workerCount }, processNext));
}

async function createFile(ctx: BackupsContext, path: AbsolutePath, remoteTree: RemoteTree) {
  const parentPath = dirname(path);
  const parent = remoteTree.folders.get(parentPath);

  if (!parent) return;

  await Sync.Actions.createFile({ ctx, path, parentUuid: parent.uuid });
}
