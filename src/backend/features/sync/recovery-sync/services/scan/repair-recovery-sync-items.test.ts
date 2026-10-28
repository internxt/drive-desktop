import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SqliteError } from '@/infra/sqlite/services/common/sqlite-error';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { RecoverySyncFile, RecoverySyncFolder } from './map-recovery-sync-page';
import { repairRecoverySyncFiles, repairRecoverySyncFolders } from './repair-recovery-sync-items';

describe('repair-recovery-sync-items', () => {
  const getFilesByUuidsMock = partialSpyOn(SqliteModule.FileModule, 'getFilesByUuids');
  const getFoldersByUuidsMock = partialSpyOn(SqliteModule.FolderModule, 'getFoldersByUuids');
  const createOrUpdateFilesMock = partialSpyOn(SqliteModule.FileModule, 'createOrUpdateBatch');
  const createOrUpdateFoldersMock = partialSpyOn(SqliteModule.FolderModule, 'createOrUpdateBatch');

  const checkpoint = '2026-01-01T00:00:00.000Z';
  const date = '2025-06-01T00:00:00.000Z';
  const item = { id: 1, plainName: 'name', createdAt: date, updatedAt: date, creationTime: date, modificationTime: date };
  const file: RecoverySyncFile = {
    ...item,
    uuid: 'file',
    status: 'EXISTS',
    type: 'txt',
    fileId: 'fileId',
    size: 1,
    folderId: 2,
    folderUuid: 'folderUuid',
  };
  const folder: RecoverySyncFolder = { ...item, uuid: 'folder', status: 'EXISTS', parentId: 2, parentUuid: 'parentUuid' };

  const { ctx } = mockProps<typeof repairRecoverySyncFiles>({ ctx: { userUuid: 'userUuid', workspaceId: 'workspaceId' } });

  beforeEach(() => {
    getFilesByUuidsMock.mockReturnValue({ data: [] });
    getFoldersByUuidsMock.mockReturnValue({ data: [] });
    createOrUpdateFilesMock.mockResolvedValue(undefined);
    createOrUpdateFoldersMock.mockResolvedValue(undefined);
  });

  it('should create missing files in the context scope', async () => {
    // When
    const { error } = await repairRecoverySyncFiles({ ctx, items: [file], checkpoint });
    // Then
    expect(error).toBeUndefined();
    call(getFilesByUuidsMock).toStrictEqual({ userUuid: 'userUuid', workspaceId: 'workspaceId', uuids: ['file'] });
    call(createOrUpdateFilesMock).toStrictEqual({ files: [{ ...file, userUuid: 'userUuid', workspaceId: 'workspaceId' }] });
  });

  it('should create missing folders in the context scope', async () => {
    // When
    const { error } = await repairRecoverySyncFolders({ ctx, items: [folder], checkpoint });
    // Then
    expect(error).toBeUndefined();
    call(getFoldersByUuidsMock).toStrictEqual({ userUuid: 'userUuid', workspaceId: 'workspaceId', uuids: ['folder'] });
    call(createOrUpdateFoldersMock).toStrictEqual({ folders: [{ ...folder, userUuid: 'userUuid', workspaceId: 'workspaceId' }] });
  });

  it('should not read or write when no item is eligible', async () => {
    // Given
    const items: RecoverySyncFile[] = [
      { ...file, status: 'TRASHED' },
      { ...file, uuid: 'newer', updatedAt: checkpoint },
    ];
    // When
    const { error } = await repairRecoverySyncFiles({ ctx, items, checkpoint });
    // Then
    expect(error).toBeUndefined();
    calls(getFilesByUuidsMock).toHaveLength(0);
    calls(createOrUpdateFilesMock).toHaveLength(0);
  });

  it('should not write folders that are up to date', async () => {
    // Given
    getFoldersByUuidsMock.mockReturnValue({ data: [{ uuid: 'folder' as FolderUuid, status: 'EXISTS', updatedAt: date }] });
    // When
    const { error } = await repairRecoverySyncFolders({ ctx, items: [folder], checkpoint });
    // Then
    expect(error).toBeUndefined();
    calls(createOrUpdateFoldersMock).toHaveLength(0);
  });

  it('should return an error when local items cannot be read', async () => {
    // Given
    getFilesByUuidsMock.mockReturnValue({ error: new SqliteError('UNKNOWN') });
    // When
    const { error } = await repairRecoverySyncFiles({ ctx, items: [file], checkpoint });
    // Then
    expect(error?.message).toBe('UNKNOWN');
    calls(createOrUpdateFilesMock).toHaveLength(0);
  });

  it('should return an error when repairs cannot be persisted', async () => {
    // Given
    createOrUpdateFoldersMock.mockResolvedValue(new SqliteError('UNKNOWN'));
    // When
    const { error } = await repairRecoverySyncFolders({ ctx, items: [folder], checkpoint });
    // Then
    expect(error?.message).toBe('UNKNOWN');
  });
});
