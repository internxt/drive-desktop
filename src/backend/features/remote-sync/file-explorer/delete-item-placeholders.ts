import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { rm } from 'node:fs/promises';
import { InMemoryFiles, InMemoryFolders } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type FileProps = { type: 'file'; remotes: ExtendedDriveFile[]; locals: InMemoryFiles };
type FolderProps = { type: 'folder'; remotes: ExtendedDriveFolder[]; locals: InMemoryFolders };
type Props = { ctx: SyncContext } & (FileProps | FolderProps);

export async function deleteItemPlaceholders({ ctx, type, remotes, locals }: Props) {
  await Promise.all(
    remotes.map(async (remote) => {
      const local = (locals as Record<string, { path: AbsolutePath }>)[remote.uuid];

      if (!local) return;

      if (local.path !== remote.absolutePath) {
        ctx.logger.error({
          msg: 'Cannot delete placeholder, path does not match',
          remotePath: remote.absolutePath,
          localPath: local.path,
          type,
        });

        return;
      }

      try {
        await rm(remote.absolutePath, { recursive: true, force: true });
      } catch (error) {
        ctx.logger.error({
          msg: 'Error deleting placeholder',
          path: remote.absolutePath,
          type,
          error,
        });
      }
    }),
  );
}
