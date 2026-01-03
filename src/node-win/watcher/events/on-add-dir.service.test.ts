import { onAddDir } from './on-add-dir.service';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import * as moveFolder from '@/backend/features/local-sync/watcher/events/rename-or-move/move-folder';
import * as trackAddEvent from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';
import { Drive } from '@/backend/features/drive';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { GetFolderInfoError } from '@/infra/node-win/services/item-identity/get-folder-info';

describe('on-add-dir', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const moveFolderMock = partialSpyOn(moveFolder, 'moveFolder');
  const createFolderMock = partialSpyOn(Drive.Actions, 'createFolder');
  const trackAddEventMock = partialSpyOn(trackAddEvent, 'trackAddEvent');

  const path = abs('/parent/folder');
  const props = mockProps<typeof onAddDir>({ path });

  it('should move folder if the folder already is a placeholder', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    // When
    await onAddDir(props);
    // Then
    call(trackAddEventMock).toStrictEqual({ uuid: 'uuid' });
    call(moveFolderMock).toMatchObject({ path, uuid: 'uuid' });
  });

  it('should create folder if it is new and parent is already a placeholder', async () => {
    // Given
    getFolderInfoMock.mockResolvedValueOnce({ error: new GetFolderInfoError('NOT_A_PLACEHOLDER') });
    getFolderInfoMock.mockResolvedValueOnce({ data: { uuid: 'parentUuid' as FolderUuid } });
    // When
    await onAddDir(props);
    // Then
    call(createFolderMock).toMatchObject({ path, parentUuid: 'parentUuid' });
  });

  it('should ignore if folder is new and parent is not a placeholder', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ error: new GetFolderInfoError('NOT_A_PLACEHOLDER') });
    // When
    await onAddDir(props);
    // Then
    calls(moveFolderMock).toHaveLength(0);
    calls(createFolderMock).toHaveLength(0);
  });
});
