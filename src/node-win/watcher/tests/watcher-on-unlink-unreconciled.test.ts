import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { sleep } from '@/apps/main/util';
import { updateFolderPlaceholder } from '@/backend/features/remote-sync/file-explorer/update-folder-placeholder';
import { addUnreconciledFolder, removeUnreconciledFolder } from '@/backend/features/remote-sync/unreconciled-folders';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as ipcMain from '@/infra/drive-server-wip/out/ipc-main';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { setupWatcher } from './watcher.helper.test';

describe('watcher-on-unlink-unreconciled', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const getFolderByNameMock = partialSpyOn(SqliteModule.FolderModule, 'getByName');
  const getFileByNameMock = partialSpyOn(SqliteModule.FileModule, 'getByName');
  const deleteFolderByUuidMock = partialSpyOn(ipcMain, 'deleteFolderByUuid');
  const deleteFileByUuidMock = partialSpyOn(ipcMain, 'deleteFileByUuid');

  const uuid = 'unreconciledUuid' as FolderUuid;
  const date = '2000-01-01T00:00:00.000Z';

  let rootPath: AbsolutePath;
  let parent: AbsolutePath;

  beforeEach(async () => {
    rootPath = join(TEST_FILES, randomUUID());
    parent = join(rootPath, 'parent');

    await mkdir(rootPath);
    await mkdir(parent);
    await mkdir(join(parent, 'child'));
    await writeFile(join(parent, 'child', 'file.txt'), 'content');

    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'parentUuid' as FolderUuid } });
    getFolderByNameMock.mockResolvedValue({ data: { uuid: 'remoteFolderUuid' as FolderUuid } });
    getFileByNameMock.mockResolvedValue({ data: { uuid: 'remoteFileUuid' as FileUuid } });
  });

  afterEach(() => {
    removeUnreconciledFolder({ uuid });
  });

  it('should propagate the deletion when the folder is in sync', async () => {
    // Given
    await setupWatcher(rootPath);
    // When
    await rm(parent, { recursive: true, force: true });
    await sleep(100);
    // Then
    calls(deleteFolderByUuidMock).toHaveLength(1);
  });

  it('should not propagate the deletion when we could not reconcile the folder', async () => {
    // Given
    addUnreconciledFolder({ uuid, path: parent });
    await setupWatcher(rootPath);
    // When
    await rm(parent, { recursive: true, force: true });
    await sleep(100);
    // Then
    calls(deleteFolderByUuidMock).toHaveLength(0);
    calls(deleteFileByUuidMock).toHaveLength(0);
  });

  it('should not propagate the deletion of a folder whose move keeps failing, like BR-2245', async () => {
    // Given
    // The remote name is already taken on disk, so windows refuses to move the placeholder and
    // the reconciliation of that folder never succeeds.
    const remotePath = join(rootPath, 'R.B. Cinema');
    await mkdir(remotePath);

    const reconciled = await updateFolderPlaceholder({
      ctx: { logger: loggerMock },
      remote: { absolutePath: remotePath, uuid, name: 'R.B. Cinema', createdAt: date, updatedAt: date },
      folders: new Map([[uuid, { path: parent }]]),
    } as any);

    expect(reconciled).toBe(false);
    await setupWatcher(rootPath);
    // When
    await rm(parent, { recursive: true, force: true });
    await sleep(100);
    // Then
    calls(deleteFolderByUuidMock).toHaveLength(0);
    calls(deleteFileByUuidMock).toHaveLength(0);
  });

  it('should not propagate the deletion of an item inside the folder we could not reconcile', async () => {
    // Given
    addUnreconciledFolder({ uuid, path: parent });
    await setupWatcher(rootPath);
    // When
    await rm(join(parent, 'child'), { recursive: true, force: true });
    await sleep(100);
    // Then
    calls(deleteFolderByUuidMock).toHaveLength(0);
    calls(deleteFileByUuidMock).toHaveLength(0);
  });
});
