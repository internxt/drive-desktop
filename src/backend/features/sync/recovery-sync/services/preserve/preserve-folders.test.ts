import { FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { FileExplorerFolders } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { SqliteError } from '@/infra/sqlite/services/common/sqlite-error';
import { ItemToPreserve } from '@/infra/sqlite/services/recovery-sync/map-item-to-preserve';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { preserveFolders } from './preserve-folders';
import * as preserveItemModule from './preserve-item';

describe('preserve-folders', () => {
  const getFoldersToPreserveMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'getFoldersToPreserve');
  const hasProtectedDescendantsMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'hasProtectedDescendants');
  const markRemovedMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'markRemovedIfEligible');
  const preserveItemMock = partialSpyOn(preserveItemModule, 'preserveItem');

  let folders: FileExplorerFolders;
  let props: Parameters<typeof preserveFolders>[0];

  function removed(uuid: string): ItemToPreserve<SimpleDriveFolder> {
    return { item: { uuid } as SimpleDriveFolder, removalStatus: 'DELETED' };
  }

  function onDisk(uuid: string, path: string) {
    folders.set(uuid as FolderUuid, { path: abs(path), parentUuid: 'parentUuid' as FolderUuid });
  }

  beforeEach(() => {
    folders = new Map();
    getFoldersToPreserveMock.mockReturnValue({ data: [] });
    hasProtectedDescendantsMock.mockReturnValue({ data: false });
    markRemovedMock.mockReturnValue({ data: true });
    preserveItemMock.mockResolvedValue({ data: 'done' });

    props = mockProps<typeof preserveFolders>({
      ctx: {
        rootUuid: 'rootUuid' as FolderUuid,
        userUuid: 'userUuid',
        workspaceId: '',
        logger: loggerMock,
        abortController: new AbortController(),
      },
    });
    props.folders = folders;
  });

  it('should move the parent and only mark the subfolder that went with it', async () => {
    // Given
    getFoldersToPreserveMock.mockReturnValueOnce({ data: [removed('child'), removed('parent')] });
    onDisk('child', 'C:/Drive/Docs/Old');
    onDisk('parent', 'C:/Drive/Docs');
    // When
    const { data } = await preserveFolders(props);
    // Then
    expect(data).toStrictEqual({ moved: ['C:/Drive/Docs'], failed: [] });
    call(preserveItemMock).toMatchObject({ itemType: 'folder', uuid: 'parent', source: 'C:/Drive/Docs', removalStatus: 'DELETED' });
    call(markRemovedMock).toMatchObject({ itemType: 'folder', uuid: 'child' });
    calls(getFoldersToPreserveMock).toMatchObject([{ afterUuid: '' }, { afterUuid: 'parent' }]);
  });

  it('should only mark a folder that is not on disk', async () => {
    // Given
    getFoldersToPreserveMock.mockReturnValueOnce({ data: [removed('missing')] });
    // When
    const { data } = await preserveFolders(props);
    // Then
    expect(data).toStrictEqual({ moved: [], failed: [] });
    call(markRemovedMock).toMatchObject({ uuid: 'missing', removalStatus: 'DELETED' });
    calls(preserveItemMock).toHaveLength(0);
  });

  it('should keep a folder with contents that stay in the Drive and still preserve its subfolders', async () => {
    // Given
    getFoldersToPreserveMock.mockReturnValueOnce({ data: [removed('parent'), removed('child')] });
    onDisk('parent', 'C:/Drive/Docs');
    onDisk('child', 'C:/Drive/Docs/Old');
    hasProtectedDescendantsMock.mockReturnValueOnce({ data: true });
    // When
    const { data } = await preserveFolders(props);
    // Then
    expect(data).toStrictEqual({ moved: ['C:/Drive/Docs/Old'], failed: [] });
    call(preserveItemMock).toMatchObject({ uuid: 'child' });
    calls(markRemovedMock).toHaveLength(0);
  });

  it.each([{ data: 'failed' as const }, { error: new Error('INSIDE_SYNC_ROOT') }])(
    'should report a folder that could not be preserved and continue',
    async (result) => {
      // Given
      getFoldersToPreserveMock.mockReturnValueOnce({ data: [removed('folder1'), removed('folder2')] });
      onDisk('folder1', 'C:/Drive/A');
      onDisk('folder2', 'C:/Drive/B');
      preserveItemMock.mockResolvedValueOnce(result);
      // When
      const { data } = await preserveFolders(props);
      // Then
      expect(data).toStrictEqual({ moved: ['C:/Drive/B'], failed: ['C:/Drive/A'] });
      call(loggerMock.error).toMatchObject({ msg: 'Recovery sync folder could not be preserved', path: 'C:/Drive/A' });
    },
  );

  it('should stop when the folders cannot be read', async () => {
    // Given
    getFoldersToPreserveMock.mockReturnValue({ error: new SqliteError('UNKNOWN') });
    // When
    const { error } = await preserveFolders(props);
    // Then
    expect(error?.message).toBe('UNKNOWN');
  });

  it('should stop when it cannot check the descendants', async () => {
    // Given
    getFoldersToPreserveMock.mockReturnValueOnce({ data: [removed('folder1')] });
    onDisk('folder1', 'C:/Drive/A');
    hasProtectedDescendantsMock.mockReturnValue({ error: new SqliteError('UNKNOWN') });
    // When
    const { error } = await preserveFolders(props);
    // Then
    expect(error?.message).toBe('UNKNOWN');
    calls(preserveItemMock).toHaveLength(0);
  });

  it('should stop when the recovery is aborted', async () => {
    // Given
    getFoldersToPreserveMock.mockReturnValueOnce({ data: [removed('folder1')] });
    onDisk('folder1', 'C:/Drive/A');
    props.ctx.abortController.abort();
    // When
    const { error } = await preserveFolders(props);
    // Then
    expect(error?.name).toBe('AbortError');
    calls(preserveItemMock).toHaveLength(0);
  });
});
