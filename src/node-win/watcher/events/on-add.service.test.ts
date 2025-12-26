import { onAdd } from './on-add.service';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as moveFile from '@/backend/features/local-sync/watcher/events/rename-or-move/move-file';
import * as trackAddFileEvent from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';
import { GetFileInfoError } from '@/infra/node-win/services/item-identity/get-file-info';
import { Drive } from '@/backend/features/drive';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { GetFolderInfoError } from '@/infra/node-win/services/item-identity/get-folder-info';

describe('on-add', () => {
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const moveFileMock = partialSpyOn(moveFile, 'moveFile');
  const createFileMock = partialSpyOn(Drive.Actions, 'createFile');
  const trackAddFileEventMock = partialSpyOn(trackAddFileEvent, 'trackAddFileEvent');

  const path = abs('/parent/file.txt');
  const props = mockProps<typeof onAdd>({ path });

  it('should move file if the file already is a placeholder', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    // When
    await onAdd(props);
    // Then
    call(trackAddFileEventMock).toStrictEqual({ uuid: 'uuid' });
    call(moveFileMock).toMatchObject({ path, uuid: 'uuid' });
  });

  it('should create file if it is new and parent is already a placeholder', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({ error: new GetFileInfoError('NOT_A_PLACEHOLDER') });
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'parentUuid' as FolderUuid } });
    // When
    await onAdd(props);
    // Then
    call(createFileMock).toMatchObject({ path, parentUuid: 'parentUuid' });
  });

  it('should ignore if file is new and parent is not a placeholder', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({ error: new GetFileInfoError('NOT_A_PLACEHOLDER') });
    getFolderInfoMock.mockResolvedValue({ error: new GetFolderInfoError('NOT_A_PLACEHOLDER') });
    // When
    await onAdd(props);
    // Then
    calls(moveFileMock).toHaveLength(0);
    calls(createFileMock).toHaveLength(0);
  });
});
