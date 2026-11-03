import { FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { FileExplorerFiles } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { SqliteError } from '@/infra/sqlite/services/common/sqlite-error';
import { ItemToPreserve } from '@/infra/sqlite/services/recovery-sync/map-item-to-preserve';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { PinState } from '@/node-win/types/placeholder.type';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { preserveFiles } from './preserve-files';
import * as preserveItemModule from './preserve-item';

describe('preserve-files', () => {
  const getFilesToPreserveMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'getFilesToPreserve');
  const markRemovedMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'markRemovedIfEligible');
  const preserveItemMock = partialSpyOn(preserveItemModule, 'preserveItem');

  let files: FileExplorerFiles;
  let props: Parameters<typeof preserveFiles>[0];

  function removed(uuid: string): ItemToPreserve<SimpleDriveFile> {
    return { item: { uuid } as SimpleDriveFile, removalStatus: 'TRASHED' };
  }

  function onDisk(uuid: string, path: string, onDiskSize = 1024) {
    files.set(uuid as FileUuid, {
      path: abs(path),
      parentUuid: 'parentUuid' as FolderUuid,
      pinState: PinState.Unspecified,
      onDiskSize,
      size: 1024,
      mtimeMs: 0,
    });
  }

  beforeEach(() => {
    files = new Map();
    getFilesToPreserveMock.mockReturnValue({ data: [] });
    markRemovedMock.mockReturnValue({ data: true });
    preserveItemMock.mockResolvedValue({ data: 'done' });

    props = mockProps<typeof preserveFiles>({
      ctx: {
        rootUuid: 'rootUuid' as FolderUuid,
        userUuid: 'userUuid',
        workspaceId: '',
        logger: loggerMock,
        abortController: new AbortController(),
      },
      movedFolders: [],
    });
    props.files = files;
  });

  it('should preserve files with contents on disk, batch by batch', async () => {
    // Given
    getFilesToPreserveMock.mockReturnValueOnce({ data: [removed('file1')] }).mockReturnValueOnce({ data: [removed('file2')] });
    onDisk('file1', 'C:/Drive/a.txt');
    onDisk('file2', 'C:/Drive/b.txt', 512);
    // When
    const { data } = await preserveFiles(props);
    // Then
    expect(data).toStrictEqual([]);
    calls(preserveItemMock).toMatchObject([
      { itemType: 'file', uuid: 'file1', source: 'C:/Drive/a.txt', removalStatus: 'TRASHED' },
      { itemType: 'file', uuid: 'file2', source: 'C:/Drive/b.txt' },
    ]);
    calls(getFilesToPreserveMock).toMatchObject([{ afterUuid: '' }, { afterUuid: 'file1' }, { afterUuid: 'file2' }]);
  });

  it('should only mark files without contents on disk', async () => {
    // Given
    getFilesToPreserveMock.mockReturnValueOnce({ data: [removed('online'), removed('missing'), removed('inMovedFolder')] });
    onDisk('online', 'C:/Drive/online.txt', 0);
    onDisk('inMovedFolder', 'C:/Drive/Docs/c.txt');
    props.movedFolders = [abs('C:/Drive/Docs')];
    // When
    const { data } = await preserveFiles(props);
    // Then
    expect(data).toStrictEqual([]);
    calls(preserveItemMock).toHaveLength(0);
    calls(markRemovedMock).toMatchObject([
      { itemType: 'file', uuid: 'online', removalStatus: 'TRASHED' },
      { uuid: 'missing' },
      { uuid: 'inMovedFolder' },
    ]);
  });

  it.each([{ data: 'failed' as const }, { error: new Error('NON_EXISTS') }])(
    'should report a file that could not be preserved and continue',
    async (result) => {
      // Given
      getFilesToPreserveMock.mockReturnValueOnce({ data: [removed('file1'), removed('file2')] });
      onDisk('file1', 'C:/Drive/a.txt');
      onDisk('file2', 'C:/Drive/b.txt');
      preserveItemMock.mockResolvedValueOnce(result);
      // When
      const { data } = await preserveFiles(props);
      // Then
      expect(data).toStrictEqual(['C:/Drive/a.txt']);
      calls(preserveItemMock).toHaveLength(2);
      call(loggerMock.error).toMatchObject({ msg: 'Recovery sync file could not be preserved', path: 'C:/Drive/a.txt' });
    },
  );

  it('should stop when the files cannot be read', async () => {
    // Given
    getFilesToPreserveMock.mockReturnValue({ error: new SqliteError('UNKNOWN') });
    // When
    const { error } = await preserveFiles(props);
    // Then
    expect(error?.message).toBe('UNKNOWN');
  });

  it('should stop when the recovery is aborted', async () => {
    // Given
    props.ctx.abortController.abort();
    // When
    const { error } = await preserveFiles(props);
    // Then
    expect(error?.name).toBe('AbortError');
    calls(getFilesToPreserveMock).toHaveLength(0);
  });
});
