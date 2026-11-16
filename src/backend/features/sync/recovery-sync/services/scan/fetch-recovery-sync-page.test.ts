import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { DriveServerWipError } from '@/infra/drive-server-wip/defs';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { fetchRecoverySyncFilesPage, fetchRecoverySyncFoldersPage } from './fetch-recovery-sync-page';

describe('fetch-recovery-sync-page', () => {
  const getFilesMock = partialSpyOn(driveServerWip.files, 'getFilesSyncPage');
  const getFoldersMock = partialSpyOn(driveServerWip.folders, 'getFoldersSyncPage');
  const getWorkspaceFilesMock = partialSpyOn(driveServerWip.workspaces, 'getFilesSyncPage');
  const getWorkspaceFoldersMock = partialSpyOn(driveServerWip.workspaces, 'getFoldersSyncPage');

  const date = '2025-06-01T00:00:00.000Z';
  const item = {
    id: 1,
    status: 'TRASHED' as const,
    plainName: 'name',
    createdAt: date,
    updatedAt: date,
    creationTime: date,
    modificationTime: date,
  };
  const file = { ...item, uuid: 'uuid' as FileUuid, type: 'txt', fileId: 'fileId', size: '1', folderId: 2, folderUuid: 'folderUuid' };
  const folder = { ...item, uuid: 'uuid' as FolderUuid, parentId: 2, parentUuid: 'parentUuid' };

  let props: Parameters<typeof fetchRecoverySyncFilesPage>[0];

  beforeEach(() => {
    getFilesMock.mockResolvedValue({ data: { items: [file], nextCursor: null } });
    getFoldersMock.mockResolvedValue({ data: { items: [folder], nextCursor: null } });
    getWorkspaceFilesMock.mockResolvedValue({ data: { items: [file], nextCursor: null } });
    getWorkspaceFoldersMock.mockResolvedValue({ data: { items: [folder], nextCursor: null } });
    props = mockProps<typeof fetchRecoverySyncFilesPage>({ ctx: { workspaceId: '' }, request: { updatedAt: '1970-01-01T00:00:00.000Z' } });
  });

  it('should request personal files from the epoch without a status filter', async () => {
    // When
    const { data } = await fetchRecoverySyncFilesPage(props);
    // Then
    expect(data).toMatchObject({ items: [{ uuid: 'uuid', status: 'TRASHED', size: 1 }], nextCursor: null });
    call(getFilesMock).toStrictEqual({
      ctx: props.ctx,
      context: { query: { updatedAt: '1970-01-01T00:00:00.000Z', limit: 1000 } },
      skipLog: true,
    });
    calls(getWorkspaceFilesMock).toHaveLength(0);
  });

  it('should forward the cursor for personal folders', async () => {
    // Given
    props.request = { cursor: 'cursor' };
    // When
    const { data } = await fetchRecoverySyncFoldersPage(props);
    // Then
    expect(data?.items).toMatchObject([{ uuid: 'uuid', parentUuid: 'parentUuid' }]);
    call(getFoldersMock).toMatchObject({ context: { query: { cursor: 'cursor', limit: 1000 } } });
    calls(getWorkspaceFoldersMock).toHaveLength(0);
  });

  it('should request workspace files and folders in a workspace', async () => {
    // Given
    props.ctx = mockProps<typeof fetchRecoverySyncFilesPage>({ ctx: { workspaceId: 'workspaceId' } }).ctx;
    props.request = { cursor: 'cursor' };
    // When
    await fetchRecoverySyncFilesPage(props);
    await fetchRecoverySyncFoldersPage(props);
    // Then
    call(getWorkspaceFilesMock).toStrictEqual({ ctx: props.ctx, context: { query: { cursor: 'cursor', limit: 1000 } }, skipLog: true });
    call(getWorkspaceFoldersMock).toStrictEqual({ ctx: props.ctx, context: { query: { cursor: 'cursor', limit: 1000 } }, skipLog: true });
    calls(getFilesMock).toHaveLength(0);
    calls(getFoldersMock).toHaveLength(0);
  });

  it('should return the request error', async () => {
    // Given
    const error = new DriveServerWipError('SERVER', 'cause');
    getFilesMock.mockResolvedValue({ error });
    // When
    const result = await fetchRecoverySyncFilesPage(props);
    // Then
    expect(result.error).toBe(error);
  });

  it('should return an error when the response does not match the page', async () => {
    // Given
    getFoldersMock.mockResolvedValue({ data: { items: [{ ...folder, uuid: undefined }], nextCursor: null } });
    // When
    const { error } = await fetchRecoverySyncFoldersPage(props);
    // Then
    expect(error?.message).toBe('Invalid recovery sync folders page');
  });

  it('should return an error when the request throws', async () => {
    // Given
    getFilesMock.mockRejectedValue(new Error('unexpected'));
    // When
    const { error } = await fetchRecoverySyncFilesPage(props);
    // Then
    expect(error?.message).toBe('unexpected');
  });
});
