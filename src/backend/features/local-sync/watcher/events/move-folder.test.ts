import * as sleep from '@/apps/main/util';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Addon } from '@/node-win/addon-wrapper';
import { initWatcher } from '@/node-win/watcher/watcher';
import { loggerMock, TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn, testSleep } from '@/tests/vitest/utils.helper.test';
import { mkdir, rename } from 'node:fs/promises';
import { v4 } from 'uuid';
import { store } from './unlink/is-move-event';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as persistMoveFolder from '@/infra/drive-server-wip/out/ipc-main';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

describe('move-folder', () => {
  const sleepMock = partialSpyOn(sleep, 'sleep');
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const getFileByNameMock = partialSpyOn(SqliteModule.FileModule, 'getByName');
  const getFolderByNameMock = partialSpyOn(SqliteModule.FolderModule, 'getByName');
  const getByUuidMock = partialSpyOn(SqliteModule.FolderModule, 'getByUuid');
  const persistMoveFolderMock = partialSpyOn(persistMoveFolder, 'persistMoveFolder');
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');

  const rootPath = join(TEST_FILES, v4());

  beforeEach(() => {
    sleepMock.mockImplementation(() => testSleep(50));

    getFileByNameMock.mockResolvedValue({});
    getFolderByNameMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid, parentUuid: 'parentUuid' } });
    getByUuidMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });

    getFolderInfoMock.mockImplementation(({ path }) => {
      if (path === rootPath) return Promise.resolve({ data: { uuid: 'parentUuid' as FolderUuid } });
      return Promise.resolve({ data: { uuid: 'uuid' as FolderUuid } });
    });
  });

  it.skip('should perform move request and ignore unlink event', async () => {
    // Given
    const folder1 = join(rootPath, 'folder1');
    const folder2 = join(rootPath, 'folder2');
    await mkdir(rootPath);
    await mkdir(folder1);

    const props = mockProps<typeof initWatcher>({ ctx: { rootPath } });
    await initWatcher(props);
    // When
    await testSleep(50);
    await rename(folder1, folder2);
    await testSleep(150);
    // Then
    expect(Array.from(store.addFolderEvents.keys())).toStrictEqual(['uuid']);
    call(updateSyncStatusMock).toStrictEqual({ path: folder2 });
    calls(loggerMock.error).toHaveLength(0);
    calls(loggerMock.warn).toHaveLength(0);
    call(loggerMock.debug).toMatchObject({ msg: 'Is move folder event', path: folder1 });
    call(persistMoveFolderMock).toMatchObject({ parentUuid: 'parentUuid', path: folder2, uuid: 'uuid' });
  });
});
