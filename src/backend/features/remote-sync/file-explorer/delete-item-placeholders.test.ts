import { call, calls, mockProps } from '@/tests/vitest/utils.helper.test';
import { deleteItemPlaceholders } from './delete-item-placeholders';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { rm } from 'node:fs/promises';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

vi.mock(import('node:fs/promises'));

describe('delete-item-placeholders', () => {
  const rmMock = vi.mocked(rm);

  const uuid = 'uuid' as FileUuid;
  const path = abs('/drive/file.txt');

  let props: Parameters<typeof deleteItemPlaceholders>[0];

  beforeEach(() => {
    props = mockProps<typeof deleteItemPlaceholders>({
      remotes: [{ absolutePath: path, uuid }],
      locals: { [uuid]: { path } },
      type: 'file',
    });
  });

  it('should skip if local item does not exist', async () => {
    // Given
    props.locals = {};
    // When
    await deleteItemPlaceholders(props);
    // Then
    calls(rmMock).toHaveLength(0);
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should skip if paths do not match', async () => {
    // Given
    props.locals = { [uuid]: { path: abs('/drive/other.txt') } };
    // When
    await deleteItemPlaceholders(props);
    // Then
    calls(rmMock).toHaveLength(0);
    call(loggerMock.error).toStrictEqual({
      msg: 'Cannot delete placeholder, path does not match',
      localPath: '/drive/other.txt',
      remotePath: '/drive/file.txt',
      type: 'file',
    });
  });

  it('should delete item if paths match', async () => {
    // When
    await deleteItemPlaceholders(props);
    // Then
    calls(loggerMock.error).toHaveLength(0);
    call(rmMock).toStrictEqual([path, { recursive: true, force: true }]);
  });
});
