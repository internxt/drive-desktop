import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createFolder } from './create-folder';
import { Addon } from '@/node-win/addon-wrapper';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Sync } from '@/backend/features/sync';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as createPendingItems from './create-pending-items';

describe('create-folder', () => {
  const createFolderMock = partialSpyOn(Sync.Actions, 'createFolder');
  const convertToPlaceholderMock = partialSpyOn(Addon, 'convertToPlaceholder');
  const createPendingItemsMock = partialSpyOn(createPendingItems, 'createPendingItems');

  const path = abs('/folder');
  const props = mockProps<typeof createFolder>({ path });

  it('should not convert to placeholder if folder creation fails', async () => {
    // Given
    createFolderMock.mockResolvedValue(undefined);
    // When
    await createFolder(props);
    // Then
    calls(convertToPlaceholderMock).toHaveLength(0);
  });

  it('should convert to placeholder if folder creation success', async () => {
    // Given
    createFolderMock.mockResolvedValue({ uuid: 'uuid' as FolderUuid });
    // When
    await createFolder(props);
    // Then
    call(convertToPlaceholderMock).toMatchObject({ path, placeholderId: 'FOLDER:uuid' });
  });

  it('should check children if folder creation success', async () => {
    // Given
    createFolderMock.mockResolvedValue({ uuid: 'uuid' as FolderUuid });
    // When
    await createFolder(props);
    // Then
    call(createPendingItemsMock).toMatchObject({ parentPath: path, parentUuid: 'uuid' });
  });
});
