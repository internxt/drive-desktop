import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { Backup } from './Backups';
import { beforeAll } from 'vitest';
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
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as createAndUploadThumbnail from '../main/thumbnail/create-and-upload-thumbnail';

describe('backups', () => {
  const getFilesMock = partialSpyOn(SqliteModule.FileModule, 'getByWorkspaceId');
  const getFoldersMock = partialSpyOn(SqliteModule.FolderModule, 'getByWorkspaceId');
  const persistFolderMock = partialSpyOn(ipcMain, 'persistFolder');
  const createFileMock = partialSpyOn(driveServerWip.files, 'createFile');
  const replaceFileMock = partialSpyOn(driveServerWip.files, 'replaceFile');
  const deleteFileByUuidMock = partialSpyOn(ipcMain, 'deleteFileByUuid');
  const deleteFolderByUuidMock = partialSpyOn(ipcMain, 'deleteFolderByUuid');
  const createOrUpdateFileMock = partialSpyOn(createOrUpdateFile, 'createOrUpdateFile');
  const createAndUploadThumbnailMock = partialSpyOn(createAndUploadThumbnail, 'createAndUploadThumbnail');

  const testPath = join(TEST_FILES, v4());
  const folder = join(testPath, 'folder');
  const addedFolder = join(testPath, 'addedFolder');
  const unmodifiedFile = join(testPath, 'unmodifiedFile');
  const modifiedFile = join(testPath, 'modifiedFile');
  const addedFile = join(folder, 'addedFile.txt');
  const rootUuid = v4();

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

    fileUploader.run.mockResolvedValue({ data: 'contentsId' as ContentsId });
    persistFolderMock.mockResolvedValue({ data: { uuid: 'createFolder' as FolderUuid } });
    createFileMock.mockResolvedValue({ data: { uuid: 'createFile' as FileUuid } });
    replaceFileMock.mockResolvedValueOnce({ data: { uuid: 'replaceFile' } });

    // When
    await service.run(props);

    // Then
    calls(fileUploader.run).toMatchObject([
      { path: expect.stringContaining('addedFile'), size: 7 },
      { path: expect.stringContaining('modifiedFile'), size: 7 },
    ]);
    call(deleteFileByUuidMock).toMatchObject({ uuid: 'deletedFile' });
    call(deleteFolderByUuidMock).toMatchObject({ uuid: 'deletedFolder' });
    call(persistFolderMock).toMatchObject({ path: addedFolder, parentUuid: rootUuid });
    call(replaceFileMock).toMatchObject({ uuid: 'modifiedFile', contentsId: 'contentsId', size: 7 });
    calls(createOrUpdateFileMock).toMatchObject([{ fileDto: { uuid: 'replaceFile' } }, { fileDto: { uuid: 'createFile' } }]);
    call(createAndUploadThumbnailMock).toMatchObject({ fileUuid: 'createFile' });
    call(createFileMock).toStrictEqual({
      path: addedFile,
      body: {
        bucket: undefined,
        encryptVersion: '03-aes',
        fileId: 'contentsId',
        folderUuid: 'folder',
        plainName: 'addedFile',
        size: 7,
        type: 'txt',
      },
    });

    expect(loggerMock.error).toBeCalledTimes(0);
    expect(loggerMock.warn).toBeCalledTimes(0);
    calls(loggerMock.debug).toStrictEqual([
      { tag: 'BACKUPS', msg: 'Files diff', added: 1, modified: 1, deleted: 1, unmodified: 1, total: 4 },
      { tag: 'BACKUPS', msg: 'Folders diff', added: 1, deleted: 1, unmodified: 2, total: 3 },
      { tag: 'BACKUPS', msg: 'Total items to backup', total: 7, alreadyBacked: 3 },
    ]);
  });
});
