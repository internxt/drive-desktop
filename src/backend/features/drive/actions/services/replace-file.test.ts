import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { Sync } from '@/backend/features/sync';
import { WaitUntilReadyError } from '@/backend/features/sync/actions/services/wait-until-ready';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Addon } from '@/node-win/addon-wrapper';
import { InSyncState } from '@/node-win/types/placeholder.type';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { replaceFile } from './replace-file';
import * as waitForLocalFile from './wait-for-local-file';

describe('replace-file', () => {
  const replaceFileMock = partialSpyOn(Sync.Actions, 'replaceFile');
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');
  const waitForLocalFileMock = partialSpyOn(waitForLocalFile, 'waitForLocalFile');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');

  const path = abs('/file.txt');
  const uuid = 'uuid' as FileUuid;
  const props = mockProps<typeof replaceFile>({ ctx: { logger: loggerMock }, path, uuid });

  beforeEach(() => {
    waitForLocalFileMock.mockResolvedValue({ data: true });
  });

  async function retryFromLastWait() {
    const { retry } = waitForLocalFileMock.mock.calls[0][0];
    waitForLocalFileMock.mockClear();
    await retry();
  }

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
    replaceFileMock.mockResolvedValue({ uuid });
    // When
    await replaceFile(props);
    // Then
    call(updateSyncStatusMock).toMatchObject({ path });
  });

  it('should not replace the file if it is not ready', async () => {
    // Given
    waitForLocalFileMock.mockResolvedValue({ error: new WaitUntilReadyError('IDLE_TIMEOUT') });
    // When
    await replaceFile(props);
    // Then
    calls(replaceFileMock).toHaveLength(0);
  });

  it('should replace the file on retry if it is still not in sync', async () => {
    // Given
    waitForLocalFileMock.mockResolvedValueOnce({ error: new WaitUntilReadyError('IDLE_TIMEOUT') });
    getFileInfoMock.mockResolvedValue({ data: { inSyncState: InSyncState.NotSync } });
    replaceFileMock.mockResolvedValue({ uuid });
    await replaceFile(props);
    // When
    await retryFromLastWait();
    // Then
    call(replaceFileMock).toMatchObject({ path, uuid });
    call(updateSyncStatusMock).toMatchObject({ path });
  });

  it('should not replace the file on retry if it is already in sync', async () => {
    // Given
    waitForLocalFileMock.mockResolvedValueOnce({ error: new WaitUntilReadyError('IDLE_TIMEOUT') });
    getFileInfoMock.mockResolvedValue({ data: { inSyncState: InSyncState.Sync } });
    await replaceFile(props);
    // When
    await retryFromLastWait();
    // Then
    calls(waitForLocalFileMock).toHaveLength(0);
    calls(replaceFileMock).toHaveLength(0);
  });
});
