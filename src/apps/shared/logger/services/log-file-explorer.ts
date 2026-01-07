import { SyncContext } from '@/apps/sync-engine/config';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { PATHS } from '@/core/electron/paths';
import { statReaddir } from '@/infra/file-system/services/stat-readdir';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { writeFile } from 'node:fs/promises';

type Props = {
  ctx: SyncContext;
};

export async function logFileExplorer({ ctx }: Props) {
  const files: string[] = [];
  const folders: string[] = [];
  const rootPathLength = ctx.rootPath.length + 1;

  async function walk(parentPath: AbsolutePath) {
    const items = await statReaddir({ folder: parentPath });

    const filePromises = items.files.map(async ({ path, stats }) => {
      const { data: fileInfo } = await NodeWin.getFileInfo({ path });

      const rPath = `"${path.slice(rootPathLength)}"`;

      if (fileInfo) {
        files.push([rPath, fileInfo.placeholderId, fileInfo.pinState, fileInfo.inSyncState, stats.size, fileInfo.onDiskSize].join(','));
      } else {
        files.push([rPath].join(','));
      }
    });

    const folderPromises = items.folders.map(async ({ path }) => {
      const { data: folderInfo } = await NodeWin.getFolderInfo({ ctx, path });

      const rPath = `"${path.slice(rootPathLength)}"`;

      if (folderInfo) {
        folders.push([rPath, folderInfo.placeholderId, folderInfo.pinState, folderInfo.inSyncState].join(','));
        await walk(path);
      } else {
        folders.push([rPath].join(','));
      }
    });

    await Promise.all(filePromises.concat(folderPromises));
  }

  await walk(ctx.rootPath);

  const csvContent = ['path,uuid,pinState,inSyncState,size,onDiskSize', 'files', ...files, 'folders', ...folders].join('\n');
  const name = ctx.workspaceId ? `file-explorer-${ctx.workspaceId}.csv` : 'file-explorer.csv';
  const csvPath = join(PATHS.LOGS, name);
  await writeFile(csvPath, csvContent, 'utf-8');

  return csvPath;
}
