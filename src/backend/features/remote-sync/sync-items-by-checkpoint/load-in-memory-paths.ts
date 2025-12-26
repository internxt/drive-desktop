import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Stats } from 'node:fs';
import { SyncContext } from '@/apps/sync-engine/config';
import { statReaddir } from '@/infra/file-system/services/stat-readdir';

export type InMemoryFiles = Map<FileUuid, { path: AbsolutePath; stats: Stats }>;
export type InMemoryFolders = Map<FolderUuid, { path: AbsolutePath }>;

type Props = {
  ctx: SyncContext;
  parentPath: AbsolutePath;
};

export async function loadInMemoryPaths({ ctx, parentPath }: Props) {
  const files: InMemoryFiles = new Map();
  const folders: InMemoryFolders = new Map();

  const items = await statReaddir({ folder: parentPath });

  const filePromises = items.files.map(async ({ path, stats }) => {
    const { data: fileInfo } = await NodeWin.getFileInfo({ path });
    if (fileInfo) {
      files.set(fileInfo.uuid, { stats, path });
    }
  });

  const folderPromises = items.folders.map(async ({ path }) => {
    const { data: folderInfo } = await NodeWin.getFolderInfo({ ctx, path });
    if (folderInfo) {
      folders.set(folderInfo.uuid, { path });
    }
  });

  await Promise.all([...filePromises, ...folderPromises]);

  return { files, folders };
}
