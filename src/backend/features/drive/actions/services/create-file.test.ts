import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { Sync } from '@/backend/features/sync';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as getInFlightRequest from '@/infra/drive-server-wip/in/get-in-flight-request';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createFile } from './create-file';

describe('create-file', () => {
  const createFileMock = partialSpyOn(Sync.Actions, 'createFile');
  const convertToPlaceholderMock = partialSpyOn(Addon, 'convertToPlaceholder');
  const getInFlightRequestMock = partialSpyOn(getInFlightRequest, 'getInFlightRequest', false);

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

  it('should ignore the event if the create file request is duplicated', async () => {
    // Given
    getInFlightRequestMock.mockReturnValueOnce({ reused: true, promise: Promise.resolve() });
    // When
    await createFile(props);
    // Then
    calls(convertToPlaceholderMock).toHaveLength(0);
    call(loggerMock.debug).toMatchObject({ msg: 'Create file event duplicated, ignore this one', path });
  });
});
