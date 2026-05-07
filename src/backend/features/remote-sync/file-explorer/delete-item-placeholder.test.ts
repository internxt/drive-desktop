import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm } from 'node:fs/promises';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerFn, loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, partialSpyOn, TestProps } from '@/tests/vitest/utils.helper.test';
import { deleteItemPlaceholder } from './delete-item-placeholder';

vi.mock(import('node:fs/promises'));
vi.mock(import('node:crypto'));

describe('delete-item-placeholder', () => {
  const mkdirMock = vi.mocked(mkdir);
  const renameMock = vi.mocked(rename);
  const rmMock = vi.mocked(rm);
  const randomUUIDMock = vi.mocked(randomUUID);
  const getFirstNonPlaceholderMock = partialSpyOn(Addon, 'getFirstNonPlaceholder');

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

  it('should log and delete item if local and remote paths do not match', async () => {
    // Given
    props.remote!.absolutePath = abs('/remote');
    // When
    await deleteItemPlaceholder(props as any);
    // Then
    calls(loggerFn).toMatchObject([{ msg: 'Path does not match when deleting placeholder' }, { msg: 'Delete placeholder' }]);
    call(rmMock).toStrictEqual(localPath);
  });

  it('should delete item directly if paths match', async () => {
    // When
    await deleteItemPlaceholder(props as any);
    // Then
    call(loggerFn).toMatchObject({ msg: 'Delete placeholder' });
    call(rmMock).toStrictEqual(localPath);
  });

  it('should ignore folder if folder contains a non placeholder item', async () => {
    props.type = 'folder';
    getFirstNonPlaceholderMock.mockResolvedValue('non_placeholder');
    // When
    await deleteItemPlaceholder(props as any);
    // Then
    calls(loggerFn).toMatchObject([
      { msg: 'Delete placeholder' },
      { msg: 'Folder cannot be deleted because it contains a non placeholder item' },
    ]);
    calls(rmMock).toHaveLength(0);
  });

  it('should delete folder if all folder items are placeholders', async () => {
    props.type = 'folder';
    getFirstNonPlaceholderMock.mockResolvedValue(undefined);
    // When
    await deleteItemPlaceholder(props as any);
    // Then
    calls(loggerFn).toMatchObject([{ msg: 'Delete placeholder' }, { msg: 'Folder can be deleted, all items are placeholders' }]);
    call(mkdirMock).toStrictEqual([trashDir, { recursive: true }]);
    call(renameMock).toStrictEqual([localPath, trashPath]);
    call(rmMock).toStrictEqual([trashPath, { recursive: true, force: true }]);
  });
});
