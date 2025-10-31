import { logger } from '@/apps/shared/logger/logger';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { PATHS } from '@/core/electron/paths';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

export async function getWorkspaces() {
  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'Get workspaces',
  });

  const { data: workspaces, error } = await driveServerWipModule.workspaces.getWorkspaces();

  if (error) return [];

  return workspaces.availableWorkspaces.map(({ workspace, workspaceUser }) => ({
    id: workspace.id,
    /**
     * v2.5.1 Daniel Jiménez
     * The registry of windows automatically parses the providerId to camel case, so, to avoid any missmatch,
     * we are going to parse it too, and then both are the same string.
     */
    providerId: `{${workspaceUser.id.toUpperCase()}}`,
    key: workspaceUser.key,
    rootFolderId: workspaceUser.rootFolderId,
    /**
     * v2.5.1 Daniel Jiménez
     * Do not write brackets { and } in the folder name, the watcher was not picking up the changes.
     */
    rootPath: createAbsolutePath(PATHS.HOME_FOLDER_PATH, `InternxtDrive - ${workspaceUser.id}`),
  }));
}
