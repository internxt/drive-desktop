import { NodeWin } from '@/infra/node-win/node-win.module';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { rm } from 'node:fs/promises';

type Props = { ctx: ProcessSyncContext } & (
  | { remotes: ExtendedDriveFile[]; type: 'file' }
  | { remotes: ExtendedDriveFolder[]; type: 'folder' }
);

export async function deleteItemPlaceholders({ ctx, remotes, type }: Props) {
  for (const remote of remotes) {
    const info =
      type === 'folder' ? NodeWin.getFolderInfo({ path: remote.path, ctx }).data : NodeWin.getFileInfo({ path: remote.path, ctx }).data;

    /**
     * v2.5.6 Daniel Jiménez
     * Since we retrieve all deleted items that have been in that path
     * we need to be sure that the one that we are checking is the same
     */
    if (info?.uuid === remote.uuid) {
      await rm(remote.absolutePath, { recursive: true, force: true });
    }
  }
}
