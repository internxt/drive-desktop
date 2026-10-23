import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { Sync } from '@/backend/features/sync';
import { WaitUntilReadyError } from '@/backend/features/sync/actions/services/wait-until-ready';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as getInFlightRequest from '@/infra/drive-server-wip/in/get-in-flight-request';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { GetFileInfoError } from '@/infra/node-win/services/get-file-info';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createFile } from './create-file';
import * as waitForLocalFile from './wait-for-local-file';

describe('create-file', () => {
  const createFileMock = partialSpyOn(Sync.Actions, 'createFile');
  const convertToPlaceholderMock = partialSpyOn(Addon, 'convertToPlaceholder');
  const getInFlightRequestMock = partialSpyOn(getInFlightRequest, 'getInFlightRequest', false);
  const waitForLocalFileMock = partialSpyOn(waitForLocalFile, 'waitForLocalFile');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');

  const path = abs('/file.txt');
  const props = mockProps<typeof createFile>({ ctx: { logger: loggerMock }, path });

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

  it('should not create the file if it is not ready', async () => {
    // Given
    waitForLocalFileMock.mockResolvedValue({ error: new WaitUntilReadyError('IDLE_TIMEOUT') });
    // When
    await createFile(props);
    // Then
    calls(createFileMock).toHaveLength(0);
    calls(convertToPlaceholderMock).toHaveLength(0);
  });

  it('should create the file on retry if it is still not a placeholder', async () => {
    // Given
    waitForLocalFileMock.mockResolvedValueOnce({ error: new WaitUntilReadyError('IDLE_TIMEOUT') });
    getFileInfoMock.mockResolvedValue({ error: new GetFileInfoError('NOT_A_PLACEHOLDER') });
    createFileMock.mockResolvedValue({ uuid: 'uuid' as FileUuid });
    await createFile(props);
    // When
    await retryFromLastWait();
    // Then
    call(createFileMock).toMatchObject({ path });
    call(convertToPlaceholderMock).toMatchObject({ path, placeholderId: 'FILE:uuid' });
  });

  it('should not create the file on retry if it is already a placeholder', async () => {
    // Given
    waitForLocalFileMock.mockResolvedValueOnce({ error: new WaitUntilReadyError('IDLE_TIMEOUT') });
    getFileInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    await createFile(props);
    // When
    await retryFromLastWait();
    // Then
    calls(waitForLocalFileMock).toHaveLength(0);
    calls(createFileMock).toHaveLength(0);
  });
});
