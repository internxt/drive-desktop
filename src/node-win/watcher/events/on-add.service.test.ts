import { onAdd } from './on-add.service';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as moveFile from '@/backend/features/local-sync/watcher/events/rename-or-move/move-file';
import { GetFileInfoError } from '@/infra/node-win/services/get-file-info';
import { Drive } from '@/backend/features/drive';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { GetFolderInfoError } from '@/infra/node-win/services/get-folder-info';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { Addon } from '@/node-win/addon-wrapper';

describe('on-add', () => {
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const moveFileMock = partialSpyOn(moveFile, 'moveFile');
  const createFileMock = partialSpyOn(Drive.Actions, 'createFile');
  const replaceFileMock = partialSpyOn(Drive.Actions, 'replaceFile');
  const getByNameMock = partialSpyOn(SqliteModule.FileModule, 'getByName');
  const convertToPlaceholderMock = partialSpyOn(Addon, 'convertToPlaceholder');

  const path = abs('/parent/file.txt');
  const props = mockProps<typeof onAdd>({ path });

  it('should move file if it is already a placeholder', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    // When
    await onAdd(props);
    // Then
    call(moveFileMock).toMatchObject({ path, uuid: 'uuid' });
  });

  describe('what happens when file is not a placeholder', () => {
    beforeEach(() => {
      getFileInfoMock.mockResolvedValue({ error: new GetFileInfoError('NOT_A_PLACEHOLDER') });
      getFolderInfoMock.mockResolvedValue({ data: { uuid: 'parentUuid' as FolderUuid } });
    });

    it('should create file if it is not in the sqlite', async () => {
      // Given
      getByNameMock.mockResolvedValue({});
      // When
      await onAdd(props);
      // Then
      call(createFileMock).toMatchObject({ path, parentUuid: 'parentUuid' });
    });

    it('should replace file if it already exists in the sqlite', async () => {
      // Given
      getByNameMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
      // When
      await onAdd(props);
      // Then
      call(convertToPlaceholderMock).toMatchObject({ path, placeholderId: 'FILE:uuid' });
      call(replaceFileMock).toMatchObject({ path, uuid: 'uuid' });
    });

    it('should ignore if parent is not a placeholder', async () => {
      // Given
      getFolderInfoMock.mockResolvedValue({ error: new GetFolderInfoError('NOT_A_PLACEHOLDER') });
      // When
      await onAdd(props);
      // Then
      calls(moveFileMock).toHaveLength(0);
      calls(createFileMock).toHaveLength(0);
    });
  });
});
