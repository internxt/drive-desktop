import { unlink } from 'node:fs/promises';

import { FileSystemModule } from '@/backend/infra/file-system/file-system.module';
import type { AbsolutePath } from '@/backend/infra/file-system/file-system.types';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, deepMocked, partialSpyOn } from '@/tests/vitest/utils.helper.test';

import { cleanerStore } from '../stores/cleaner.store';
import { deleteFileSafely } from './delete-file-saftly';

vi.mock(import('node:fs/promises'));

const mockedUnlink = deepMocked(unlink);
const mockedStatThrow = partialSpyOn(FileSystemModule, 'statThrow');

describe('deleteFileSafely', () => {
  const testFilePath = '/test/path/file.txt' as AbsolutePath;

  beforeEach(() => {
    cleanerStore.reset();
  });

  it('should delete file successfully and update store', async () => {
    // Given
    mockedStatThrow.mockResolvedValue({ size: 1024 });
    mockedUnlink.mockResolvedValue(undefined);
    // When
    await deleteFileSafely({ absolutePath: testFilePath });
    // Then
    call(mockedStatThrow).toMatchObject({ absolutePath: testFilePath });
    call(mockedUnlink).toMatchObject(testFilePath);
    expect(cleanerStore.state.deletedFilesCount).toBe(1);
    expect(cleanerStore.state.totalSpaceGained).toBe(1024);
    expect(loggerMock.warn).not.toBeCalled();
  });

  it('should handle stat error gracefully', async () => {
    // Given
    mockedStatThrow.mockRejectedValue(new Error('File not found'));
    // When
    await deleteFileSafely({ absolutePath: testFilePath });
    // Then
    expect(cleanerStore.state.deletedFilesCount).toBe(0);
    expect(cleanerStore.state.totalSpaceGained).toBe(0);
    expect(mockedUnlink).not.toBeCalled();
    call(mockedStatThrow).toMatchObject({ absolutePath: testFilePath });
    call(loggerMock.warn).toMatchObject({
      tag: 'CLEANER',
      msg: 'Failed to delete file, continuing with next file',
      absolutePath: testFilePath,
      error: {
        message: 'File not found',
      },
    });
  });

  it('should handle unlink error gracefully', async () => {
    // Given
    mockedStatThrow.mockResolvedValue({ size: 512 });
    const unlinkError = new Error('Permission denied');
    mockedUnlink.mockRejectedValue(unlinkError);
    // When
    await deleteFileSafely({ absolutePath: testFilePath });
    // Then
    expect(cleanerStore.state.deletedFilesCount).toBe(0);
    expect(cleanerStore.state.totalSpaceGained).toBe(0);
    call(mockedStatThrow).toMatchObject({ absolutePath: testFilePath });
    call(mockedUnlink).toMatchObject(testFilePath);
    call(loggerMock.warn).toMatchObject({
      tag: 'CLEANER',
      msg: 'Failed to delete file, continuing with next file',
      absolutePath: testFilePath,
      error: {
        message: 'Permission denied',
      },
    });
  });
});
