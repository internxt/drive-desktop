import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { BackupsContext } from '../BackupInfo';
import { LocalFolder } from '@/context/local/localFolder/domain/LocalFolder';
import { RemoteTree } from '../remote-tree/traverser';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import type { Backup } from '../Backups';
import { persistFolder } from '@/infra/drive-server-wip/out/ipc-main';

type TProps = {
  self: Backup;
  context: BackupsContext;
  tracker: BackupsProcessTracker;
  added: Array<LocalFolder>;
  tree: RemoteTree;
};

export async function createFolders({ self, context, added, tree, tracker }: TProps) {
  const sortedAdded = added.toSorted((a, b) => a.absolutePath.localeCompare(b.absolutePath));

  for (const local of sortedAdded) {
    if (context.abortController.signal.aborted) {
      return;
    }

    await createFolder({ context, local, tree });
    self.backed++;
    tracker.currentProcessed(self.backed);
  }
}

async function createFolder({ context, local, tree }: { context: BackupsContext; local: LocalFolder; tree: RemoteTree }) {
  if (local.absolutePath === context.pathname) return;

  const parentPath = pathUtils.dirname(local.absolutePath);
  const parent = tree.folders.get(parentPath);

  if (!parent) return;

  const { data: folder, error } = await persistFolder({
    ctx: context,
    path: local.absolutePath,
    parentUuid: parent.uuid,
  });

  if (folder) {
    tree.folders.set(local.absolutePath, {
      ...folder,
      absolutePath: local.absolutePath,
    });
  } else if (error.code !== 'ABORTED') {
    context.addIssue({ error: 'CREATE_FOLDER_FAILED', name: local.absolutePath });
  }
}
