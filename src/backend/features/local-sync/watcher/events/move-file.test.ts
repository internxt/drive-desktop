import * as sleep from '@/apps/main/util';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { Addon } from '@/node-win/addon-wrapper';
import { initWatcher } from '@/node-win/watcher/watcher';
import { loggerMock, TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn, testSleep } from '@/tests/vitest/utils.helper.test';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { v4 } from 'uuid';
import { store } from './unlink/is-move-event';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('move-file', () => {
  partialSpyOn(sleep, 'sleep');
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');

  const rootPath = join(TEST_FILES, v4());

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    invokeMock.mockImplementation((event, _) => {
      if (event === 'fileGetByName') {
        return Promise.resolve({ data: { uuid: 'uuid' } });
      } else if (event === 'fileGetByUuid') {
        return Promise.resolve({ data: { parentUuid: 'parentUuid' } });
      } else {
        return Promise.resolve({ data: {} });
      }
    });

    getFileInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'parentUuid' as FolderUuid } });
  });

  it('should perform move request and ignore unlink event', async () => {
    // Given
    const file1 = join(rootPath, 'file1');
    const file2 = join(rootPath, 'file2');
    await mkdir(rootPath);
    await writeFile(file1, 'content');

    const props = mockProps<typeof initWatcher>({ ctx: { rootPath } });
    initWatcher(props);
    // When
    await testSleep(50);
    await rename(file1, file2);
    await testSleep(150);
    // Then
    expect(Array.from(store.addFileEvents.keys())).toStrictEqual(['uuid']);
    call(updateSyncStatusMock).toStrictEqual({ path: file2 });
    calls(loggerMock.error).toHaveLength(0);
    calls(loggerMock.warn).toHaveLength(0);
    calls(loggerMock.debug).toMatchObject([{ msg: 'onReady' }, { msg: 'Is move event', path: file1 }]);
    calls(invokeMock).toStrictEqual(
      expect.arrayContaining([
        ['fileGetByName', { parentUuid: 'parentUuid', nameWithExtension: 'file1' }],
        ['fileGetByUuid', { uuid: 'uuid' }],
        ['moveFileByUuid', { parentUuid: 'parentUuid', path: file2, uuid: 'uuid', workspaceToken: undefined }],
      ]),
    );
  });
});
