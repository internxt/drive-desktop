import { call, calls, mockProps } from '@/tests/vitest/utils.helper.test';
import { deleteItemPlaceholder } from './delete-item-placeholder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { rm } from 'node:fs/promises';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import trash from 'trash';

vi.mock(import('node:fs/promises'));
vi.mock(import('trash'));

describe('delete-item-placeholder', () => {
  const rmMock = vi.mocked(rm);
  const trashMock = vi.mocked(trash);

  const uuid = 'uuid' as FolderUuid;
  const path = abs('/local');

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
    calls(trashMock).toHaveLength(0);
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should trash item if paths do not match', async () => {
    // Given
    props.remote.absolutePath = abs('/remote');
    // When
    await deleteItemPlaceholder(props);
    // Then
    calls(rmMock).toHaveLength(0);
    call(trashMock).toStrictEqual('/local');
    call(loggerMock.error).toStrictEqual({
      msg: 'Path does not match when removing placeholder',
      localPath: '/local',
      remotePath: '/remote',
      type: 'folder',
    });
  });

  it('should delete item if paths match', async () => {
    // When
    await deleteItemPlaceholder(props);
    // Then
    calls(loggerMock.error).toHaveLength(0);
    calls(trashMock).toHaveLength(0);
    call(rmMock).toStrictEqual(['/local', { recursive: true, force: true }]);
  });
});
