import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { Backup } from './Backups';
import { beforeAll } from 'vitest';
import { join } from 'node:path';
import { loggerMock, TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { mkdir, writeFile } from 'node:fs/promises';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { mockDeep } from 'vitest-mock-extended';
import { BackupsProcessTracker } from '../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { ContentsId, FileUuid } from '../main/database/entities/DriveFile';
import * as ipcMain from '@/infra/drive-server-wip/out/ipc-main';
import { FolderUuid } from '../main/database/entities/DriveFolder';
import * as createOrUpdateFile from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';

describe('backups', () => {
  const getFilesByFolderMock = partialSpyOn(driveServerWip.folders, 'getFilesByFolder');
  const getFoldersByFolderMock = partialSpyOn(driveServerWip.folders, 'getFoldersByFolder');
  const createFolderMock = partialSpyOn(ipcMain, 'createFolder');
  const createFileMock = partialSpyOn(driveServerWip.files, 'createFile');
  const replaceFileMock = partialSpyOn(driveServerWip.files, 'replaceFile');
  const deleteFileByUuidMock = partialSpyOn(ipcMain, 'deleteFileByUuid');
  const deleteFolderByUuidMock = partialSpyOn(ipcMain, 'deleteFolderByUuid');
  const createOrUpdateFileMock = partialSpyOn(createOrUpdateFile, 'createOrUpdateFile');

  const testPath = join(TEST_FILES, v4());
  const unmodifiedFolder = join(testPath, 'unmodifiedFolder');
  const addedFolder = join(testPath, 'addedFolder');
  const unmodifiedFile = join(testPath, 'unmodifiedFile');
  const modifiedFile = join(testPath, 'modifiedFile');
  const addedFile = join(unmodifiedFolder, 'addedFile.txt');
  const rootUuid = v4();
  const unmodifiedFolderUuid = v4();
  const deletedFolderUuid = v4();

  const tracker = mockDeep<BackupsProcessTracker>();
  const fileUploader = mockDeep<EnvironmentFileUploader>();

  const service = new Backup();
  const props = mockProps<typeof service.run>({
    tracker,
    context: {
      folderId: 1,
      folderUuid: rootUuid,
      pathname: testPath,
      abortController: new AbortController(),
      fileUploader,
    },
  });

  beforeAll(async () => {
    await mkdir(testPath);
    await mkdir(unmodifiedFolder);
    await mkdir(addedFolder);
    await writeFile(unmodifiedFile, 'content');
    await writeFile(modifiedFile, 'content');
    await writeFile(addedFile, 'content');
  });

  it('should perform a complete backup', async () => {
    // Given
    // @ts-expect-error not sure why this error
    getFoldersByFolderMock.mockImplementation(({ folderUuid }) => {
      if (folderUuid === rootUuid) {
        return {
          data: [
            { id: 1, uuid: unmodifiedFolderUuid, parentUuid: rootUuid, plainName: 'unmodifiedFolder', status: 'EXISTS' },
            { id: 1, uuid: deletedFolderUuid, parentUuid: rootUuid, plainName: 'deletedFolder', status: 'EXISTS' },
          ],
        };
      }

      return { data: [] };
    });

    // @ts-expect-error not sure why this error
    getFilesByFolderMock.mockImplementation(({ folderUuid }) => {
      if (folderUuid === rootUuid) {
        return {
          data: [
            { folderUuid: rootUuid, plainName: 'unmodifiedFile', size: '7' },
            { uuid: 'modifiedFile' as FileUuid, folderUuid: rootUuid, plainName: 'modifiedFile', size: '12' },
          ],
        };
      }

      if (folderUuid === unmodifiedFolderUuid) {
        return { data: [{ uuid: 'deletedFile' as FileUuid, folderUuid: unmodifiedFolderUuid, plainName: 'deleted' }] };
      }

      return { data: [] };
    });

    fileUploader.run.mockResolvedValue({ data: 'newContentsId' as ContentsId });
    createFolderMock.mockResolvedValue({ data: { uuid: 'createFolder' as FolderUuid } });
    createFileMock.mockResolvedValue({ data: { uuid: 'createFile' as FileUuid } });
    replaceFileMock.mockResolvedValueOnce({ data: { uuid: 'replaceFile' } });

    // When
    await service.run(props);

    // Then
    expect(fileUploader.run).toBeCalledTimes(2);
    call(deleteFileByUuidMock).toMatchObject({ uuid: 'deletedFile', workspaceToken: '' });
    call(deleteFolderByUuidMock).toMatchObject({ uuid: deletedFolderUuid, workspaceToken: '' });
    call(createFolderMock).toMatchObject({ path: '/addedFolder', parentUuid: rootUuid, plainName: 'addedFolder' });
    call(replaceFileMock).toMatchObject({ uuid: 'modifiedFile', newContentId: 'newContentsId', newSize: 7 });
    calls(createOrUpdateFileMock).toMatchObject([{ fileDto: { uuid: 'replaceFile' } }, { fileDto: { uuid: 'createFile' } }]);

    call(createFileMock).toStrictEqual({
      path: '/unmodifiedFolder/addedFile.txt',
      body: {
        bucket: undefined,
        encryptVersion: '03-aes',
        fileId: 'newContentsId',
        folderUuid: unmodifiedFolderUuid,
        plainName: 'addedFile',
        size: 7,
        type: 'txt',
      },
    });

    expect(loggerMock.error).toBeCalledTimes(0);
    expect(loggerMock.warn).toBeCalledTimes(0);
    calls(loggerMock.debug).toStrictEqual([
      { tag: 'BACKUPS', msg: 'Fetch backup items started' },
      { tag: 'BACKUPS', msg: 'Fetch backup items finished', files: 3, folders: 2 },
      { tag: 'BACKUPS', msg: 'Files diff', added: 1, modified: 1, deleted: 1, unmodified: 1, total: 4 },
      { tag: 'BACKUPS', msg: 'Folders diff', added: 1, deleted: 1, unmodified: 2, total: 3 },
      { tag: 'BACKUPS', msg: 'Total items to backup', total: 7, alreadyBacked: 3 },
    ]);
  });
});
