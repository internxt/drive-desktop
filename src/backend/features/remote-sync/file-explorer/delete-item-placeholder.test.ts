import trash from 'trash';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps } from '@/tests/vitest/utils.helper.test';
import { deleteItemPlaceholder } from './delete-item-placeholder';

vi.mock(import('trash'));

describe('delete-item-placeholder', () => {
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
    calls(trashMock).toHaveLength(0);
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should log and trash item if paths do not match', async () => {
    // Given
    props.remote.absolutePath = abs('/remote');
    // When
    await deleteItemPlaceholder(props);
    // Then
    call(trashMock).toStrictEqual('/local');
    call(loggerMock.error).toStrictEqual({
      msg: 'Path does not match when deleting placeholder',
      localPath: '/local',
      remotePath: '/remote',
      type: 'folder',
    });
  });

  it('should trash item if paths match', async () => {
    // When
    await deleteItemPlaceholder(props);
    // Then
    calls(loggerMock.error).toHaveLength(0);
    call(trashMock).toStrictEqual('/local');
  });
});
