import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createPendingFiles } from './create-pending-files';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as createFile from './create-file';
import { GetFileInfoError } from '@/infra/node-win/services/item-identity/get-file-info';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('create-pending-files', () => {
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const createFileMock = partialSpyOn(createFile, 'createFile');

  const path = abs('/file.txt');
  const props = mockProps<typeof createPendingFiles>({ files: [{ path }] });

  it('should ignore if the file is already a placeholder', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    // When
    await createPendingFiles(props);
    // Then
    calls(createFileMock).toHaveLength(0);
  });

  it('should create file if it is not a placeholder', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({ error: new GetFileInfoError('NOT_A_PLACEHOLDER') });
    // When
    await createPendingFiles(props);
    // Then
    call(createFileMock).toMatchObject({ path });
  });

  it('should log other errors', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({ error: new GetFileInfoError('UNKNOWN') });
    // When
    await createPendingFiles(props);
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error getting file info' });
  });
});
