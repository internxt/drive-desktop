import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { Backup } from './Backups';
import { beforeAll } from 'vitest';
import { loggerMock, TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { mkdir, writeFile } from 'node:fs/promises';
import { mockDeep } from 'vitest-mock-extended';
import { BackupsProcessTracker } from '../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { FileUuid } from '../main/database/entities/DriveFile';
import * as ipcMain from '@/infra/drive-server-wip/out/ipc-main';
import { FolderUuid } from '../main/database/entities/DriveFolder';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Sync } from '@/backend/features/sync';

describe('backups', () => {
  const getFilesMock = partialSpyOn(SqliteModule.FileModule, 'getByWorkspaceId');
  const getFoldersMock = partialSpyOn(SqliteModule.FolderModule, 'getByWorkspaceId');
  const createFileMock = partialSpyOn(Sync.Actions, 'createFile');
  const createFolderMock = partialSpyOn(Sync.Actions, 'createFolder');
  const replaceFileMock = partialSpyOn(Sync.Actions, 'replaceFile');
  const deleteFileByUuidMock = partialSpyOn(ipcMain, 'deleteFileByUuid');
  const deleteFolderByUuidMock = partialSpyOn(ipcMain, 'deleteFolderByUuid');

  const testPath = join(TEST_FILES, v4());
  const folder = join(testPath, 'folder');
  const addedFolder = join(testPath, 'addedFolder');
  const unmodifiedFile = join(testPath, 'unmodifiedFile');
  const modifiedFile = join(testPath, 'modifiedFile');
  const addedFile = join(folder, 'addedFile');
  const rootUuid = v4();

  const tracker = mockDeep<BackupsProcessTracker>();

  const service = new Backup();
  const props = mockProps<typeof service.run>({
    tracker,
    ctx: {
      folderId: 1,
      folderUuid: rootUuid,
      pathname: testPath,
      abortController: new AbortController(),
    },
  });

  beforeAll(async () => {
    await mkdir(testPath);
    await mkdir(folder);
    await mkdir(addedFolder);
    await writeFile(unmodifiedFile, 'content');
    await writeFile(modifiedFile, 'content');
    await writeFile(addedFile, 'content');
  });

  it('should perform a complete backup', async () => {
    // Given
    getFoldersMock.mockResolvedValue({
      data: [
        { uuid: 'folder' as FolderUuid, parentUuid: rootUuid, name: 'folder', status: 'EXISTS' },
        { uuid: 'deletedFolder' as FolderUuid, parentUuid: rootUuid, name: 'deletedFolder', status: 'EXISTS' },
        { status: 'DELETED' },
      ],
    });

    getFilesMock.mockResolvedValue({
      data: [
        { uuid: 'unmodifiedFile' as FileUuid, parentUuid: rootUuid, nameWithExtension: 'unmodifiedFile', size: 7, status: 'EXISTS' },
        { uuid: 'modifiedFile' as FileUuid, parentUuid: rootUuid, nameWithExtension: 'modifiedFile', size: 12, status: 'EXISTS' },
        { uuid: 'deletedFile' as FileUuid, parentUuid: 'folder', nameWithExtension: 'deleted', status: 'EXISTS' },
        { status: 'DELETED' },
      ],
    });

    createFileMock.mockResolvedValue({ uuid: 'createFile' as FileUuid });
    replaceFileMock.mockResolvedValueOnce({ uuid: 'replaceFile' as FileUuid });

    // When
    await service.run(props);

    // Then
    call(deleteFileByUuidMock).toMatchObject({ uuid: 'deletedFile' });
    call(deleteFolderByUuidMock).toMatchObject({ uuid: 'deletedFolder' });
    call(createFolderMock).toMatchObject({ path: addedFolder, parentUuid: rootUuid });
    call(replaceFileMock).toMatchObject({ uuid: 'modifiedFile', stats: { size: 7 } });
    call(createFileMock).toMatchObject({ path: addedFile, parentUuid: 'folder', stats: { size: 7 } });

    expect(service.backed).toBe(8);

    expect(loggerMock.error).toBeCalledTimes(0);
    expect(loggerMock.warn).toBeCalledTimes(0);
    calls(loggerMock.debug).toStrictEqual([
      { msg: 'Files diff', added: 1, modified: 1, deleted: 1, unmodified: 1, total: 4 },
      { msg: 'Folders diff', added: 1, deleted: 1, unmodified: 2, total: 4 },
      { msg: 'Total items to backup', total: 8, alreadyBacked: 3 },
    ]);
  });
});
