import { call, calls, mockProps } from '@/tests/vitest/utils.helper.test';
import { deleteItemPlaceholder } from './delete-item-placeholder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { rm } from 'node:fs/promises';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

vi.mock(import('node:fs/promises'));

describe('delete-item-placeholder', () => {
  const rmMock = vi.mocked(rm);

  const uuid = 'uuid' as FolderUuid;
  const path = abs('/drive/folder');

  let props: Parameters<typeof deleteItemPlaceholder>[0];

  beforeEach(() => {
    props = mockProps<typeof deleteItemPlaceholder>({
      remote: { absolutePath: path, uuid },
      locals: new Map([[uuid, { path }]]),
      type: 'folder',
    });
  });

  it('should skip if local item does not exist', async () => {
    // Given
    props.locals = new Map();
    // When
    await deleteItemPlaceholder(props);
    // Then
    calls(rmMock).toHaveLength(0);
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should skip if paths do not match', async () => {
    // Given
    props.locals = new Map([[uuid, { path: abs('/drive/other') }]]);
    // When
    await deleteItemPlaceholder(props);
    // Then
    calls(rmMock).toHaveLength(0);
    call(loggerMock.error).toStrictEqual({
      msg: 'Cannot delete placeholder, path does not match',
      localPath: '/drive/other',
      remotePath: '/drive/folder',
      type: 'folder',
    });
  });

  it('should delete item if paths match', async () => {
    // When
    await deleteItemPlaceholder(props);
    // Then
    calls(loggerMock.error).toHaveLength(0);
    call(rmMock).toStrictEqual([path, { recursive: true, force: true }]);
  });
});
