import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm } from 'node:fs/promises';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerFn, loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, TestProps } from '@/tests/vitest/utils.helper.test';
import { deleteItemPlaceholder } from './delete-item-placeholder';

vi.mock(import('node:fs/promises'));
vi.mock(import('node:crypto'));

describe('delete-item-placeholder', () => {
  const mkdirMock = vi.mocked(mkdir);
  const renameMock = vi.mocked(rename);
  const rmMock = vi.mocked(rm);
  const randomUUIDMock = vi.mocked(randomUUID);

  const uuid = 'uuid' as FileUuid;
  const localPath = abs('C://Users/user/InternxtDrive/item');
  const trashDir = String.raw`C:\.internxt-trash`;
  const trashPath = String.raw`C:\.internxt-trash\randomUUID`;

  let props: TestProps<typeof deleteItemPlaceholder>;

  beforeEach(() => {
    randomUUIDMock.mockReturnValue('randomUUID' as any);
    props = {
      ctx: { logger: loggerMock },
      remote: { absolutePath: localPath, uuid },
      locals: new Map([[uuid, { path: localPath }]]),
      type: 'file',
    };
  });

  it('should skip if local item does not exist', async () => {
    // Given
    props.locals = new Map();
    // When
    await deleteItemPlaceholder(props as any);
    // Then
    calls(loggerFn).toHaveLength(0);
  });

  it('should log and delete item if paths do not match', async () => {
    // Given
    props.remote!.absolutePath = abs('/remote');
    // When
    await deleteItemPlaceholder(props as any);
    // Then
    calls(loggerFn).toMatchObject([{ msg: 'Path does not match when deleting placeholder' }, { msg: 'Delete placeholder' }]);
    call(rmMock).toStrictEqual(localPath);
  });

  it('should delete file directly if paths match', async () => {
    // When
    await deleteItemPlaceholder(props as any);
    // Then
    call(loggerFn).toMatchObject({ msg: 'Delete placeholder' });
    call(rmMock).toStrictEqual(localPath);
  });

  it('should move folder to trash dir if paths match', async () => {
    props.type = 'folder';
    // When
    await deleteItemPlaceholder(props as any);
    // Then
    call(loggerFn).toMatchObject({ msg: 'Delete placeholder' });
    call(mkdirMock).toStrictEqual([trashDir, { recursive: true }]);
    call(renameMock).toStrictEqual([localPath, trashPath]);
    call(rmMock).toStrictEqual([trashPath, { recursive: true, force: true }]);
  });
});
