import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { replaceFile } from './replace-file';
import { Addon } from '@/node-win/addon-wrapper';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Sync } from '@/backend/features/sync';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('replace-file', () => {
  const replaceFileMock = partialSpyOn(Sync.Actions, 'replaceFile');
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');

  const path = abs('/file.txt');
  const props = mockProps<typeof replaceFile>({ path });

  it('should not convert to placeholder if file creation fails', async () => {
    // Given
    replaceFileMock.mockResolvedValue(undefined);
    // When
    await replaceFile(props);
    // Then
    calls(updateSyncStatusMock).toHaveLength(0);
  });

  it('should convert to placeholder if file creation success', async () => {
    // Given
    replaceFileMock.mockResolvedValue({ uuid: 'uuid' as FileUuid });
    // When
    await replaceFile(props);
    // Then
    call(updateSyncStatusMock).toMatchObject({ path });
  });
});
