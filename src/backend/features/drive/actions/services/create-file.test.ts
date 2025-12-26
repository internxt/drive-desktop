import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createFile } from './create-file';
import { Addon } from '@/node-win/addon-wrapper';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Sync } from '@/backend/features/sync';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('create-file', () => {
  const createFileMock = partialSpyOn(Sync.Actions, 'createFile');
  const convertToPlaceholderMock = partialSpyOn(Addon, 'convertToPlaceholder');

  const path = abs('/file.txt');
  const props = mockProps<typeof createFile>({ path });

  it('should not convert to placeholder if file creation fails', async () => {
    // Given
    createFileMock.mockResolvedValue(undefined);
    // When
    await createFile(props);
    // Then
    calls(convertToPlaceholderMock).toHaveLength(0);
  });

  it('should convert to placeholder if file creation success', async () => {
    // Given
    createFileMock.mockResolvedValue({ uuid: 'uuid' as FileUuid });
    // When
    await createFile(props);
    // Then
    call(convertToPlaceholderMock).toMatchObject({ path, placeholderId: 'FILE:uuid' });
  });
});
