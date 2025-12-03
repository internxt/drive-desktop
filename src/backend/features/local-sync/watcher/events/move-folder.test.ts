import * as sleep from '@/apps/main/util';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { Addon } from '@/node-win/addon-wrapper';
import { Watcher } from '@/node-win/watcher/watcher';
import { loggerMock, TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn, testSleep } from '@/tests/vitest/utils.helper.test';
import { mkdir, rename } from 'node:fs/promises';
import { v4 } from 'uuid';
import { store } from './unlink/is-move-event';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('move-folder', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');
  const sleepMock = partialSpyOn(sleep, 'sleep');

  const rootPath = join(TEST_FILES, v4());

  beforeEach(() => {
    sleepMock.mockImplementation(() => testSleep(50));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    invokeMock.mockImplementation((event, _) => {
      if (event === 'folderGetByName') {
        return Promise.resolve({ data: { uuid: 'uuid' } });
      } else if (event === 'folderGetByUuid') {
        return Promise.resolve({ data: { parentUuid: 'parentUuid' } });
      } else {
        return Promise.resolve({ data: {} });
      }
    });

    getFolderInfoMock.mockImplementation(({ path }) => {
      if (path === rootPath) return { data: { uuid: 'parentUuid' as FolderUuid } };
      return { data: { uuid: 'uuid' as FolderUuid } };
    });
  });

  it('should perform move request and ignore unlink event', async () => {
    // Given
    const folder1 = join(rootPath, 'folder1');
    const folder2 = join(rootPath, 'folder2');
    await mkdir(rootPath);
    await mkdir(folder1);

    const watcher = new Watcher({ ignoreInitial: true });
    const props = mockProps<typeof watcher.watchAndWait>({ ctx: { rootPath } });
    watcher.watchAndWait(props);
    // When
    await testSleep(50);
    await rename(folder1, folder2);
    await testSleep(150);
    // Then
    expect(Array.from(store.addFolderEvents.keys())).toStrictEqual(['uuid']);
    call(updateSyncStatusMock).toStrictEqual({ path: folder2 });
    calls(loggerMock.error).toHaveLength(0);
    calls(loggerMock.warn).toHaveLength(0);
    calls(loggerMock.debug).toMatchObject([{ msg: 'onReady' }, { msg: 'Is move event', path: folder1 }]);
    calls(invokeMock).toStrictEqual(
      expect.arrayContaining([
        ['folderGetByName', { parentUuid: 'parentUuid', plainName: 'folder1' }],
        ['folderGetByUuid', { uuid: 'uuid' }],
        ['moveFolderByUuid', { parentUuid: 'parentUuid', path: folder2, uuid: 'uuid', workspaceToken: undefined }],
      ]),
    );
  });
});
