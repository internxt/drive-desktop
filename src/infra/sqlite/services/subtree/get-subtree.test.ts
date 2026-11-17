import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { DriveFile, DriveFolder } from '../../schema';
import { upsertQuery as upsertFileQuery } from '../file/queries';
import { upsertQuery as upsertFolderQuery } from '../folder/queries';
import { getSubtree } from './get-subtree';

describe('get-subtree', () => {
  const date = new Date().toISOString();
  let nextFolderId = 1;

  function insertFolder(folder: Pick<DriveFolder, 'uuid' | 'parentUuid'> & Partial<DriveFolder>) {
    db.prepare(upsertFolderQuery).run({
      id: nextFolderId++,
      status: 'EXISTS',
      plainName: folder.uuid,
      parentId: 0,
      userUuid: 'userUuid',
      workspaceId: 'workspaceId',
      createdAt: date,
      updatedAt: date,
      creationTime: date,
      modificationTime: date,
      ...folder,
    });
  }

  function insertFile(file: Pick<DriveFile, 'uuid' | 'folderUuid'> & Partial<DriveFile>) {
    db.prepare(upsertFileQuery).run({
      status: 'EXISTS',
      fileId: 'fileId',
      size: 1024,
      folderId: 1,
      userUuid: 'userUuid',
      workspaceId: 'workspaceId',
      createdAt: date,
      updatedAt: date,
      creationTime: date,
      modificationTime: date,
      plainName: file.uuid,
      type: '',
      ...file,
    });
  }

  function uuids(items: Array<{ uuid: string }> | undefined) {
    return items?.map(({ uuid }) => uuid).sort();
  }

  let props: Parameters<typeof getSubtree>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM drive_file');
    db.exec('DELETE FROM drive_folder');

    props = { userUuid: 'userUuid', workspaceId: 'workspaceId', rootUuid: 'root' };
  });

  it('returns nothing when the root has no items', () => {
    // Given
    insertFolder({ uuid: 'other', parentUuid: 'otherRoot' });
    insertFile({ uuid: 'otherFile', folderUuid: 'otherRoot' });
    // When
    const { data } = getSubtree(props);
    // Then
    expect(data).toStrictEqual({ files: [], folders: [] });
  });

  it('returns the items under the root at any depth and not the ones of other trees', () => {
    // Given
    insertFolder({ uuid: 'a', parentUuid: 'root' });
    insertFolder({ uuid: 'a1', parentUuid: 'a' });
    insertFolder({ uuid: 'backup', parentUuid: 'backupRoot' });
    insertFile({ uuid: 'inRoot', folderUuid: 'root' });
    insertFile({ uuid: 'deep', folderUuid: 'a1' });
    insertFile({ uuid: 'inBackupRoot', folderUuid: 'backupRoot' });
    insertFile({ uuid: 'inBackup', folderUuid: 'backup' });
    // When
    const { data } = getSubtree(props);
    // Then
    expect(uuids(data?.folders)).toStrictEqual(['a', 'a1']);
    expect(uuids(data?.files)).toStrictEqual(['deep', 'inRoot']);
  });

  it('returns deleted and trashed items, but not the items inside a deleted or trashed folder', () => {
    // Given
    insertFolder({ uuid: 'deleted', parentUuid: 'root', status: 'DELETED' });
    insertFolder({ uuid: 'trashed', parentUuid: 'root', status: 'TRASHED' });
    insertFolder({ uuid: 'folderInsideDeleted', parentUuid: 'deleted' });
    insertFile({ uuid: 'deletedFile', folderUuid: 'root', status: 'DELETED' });
    insertFile({ uuid: 'trashedFile', folderUuid: 'root', status: 'TRASHED' });
    insertFile({ uuid: 'insideDeleted', folderUuid: 'deleted' });
    insertFile({ uuid: 'insideTrashed', folderUuid: 'trashed' });
    // When
    const { data } = getSubtree(props);
    // Then
    expect(data?.folders).toMatchObject([
      { uuid: 'deleted', status: 'DELETED' },
      { uuid: 'trashed', status: 'TRASHED' },
    ]);
    expect(uuids(data?.files)).toStrictEqual(['deletedFile', 'trashedFile']);
  });

  it('returns only existing items when onlyExists is true', () => {
    // Given
    insertFolder({ uuid: 'a', parentUuid: 'root' });
    insertFolder({ uuid: 'deleted', parentUuid: 'root', status: 'DELETED' });
    insertFile({ uuid: 'existing', folderUuid: 'root' });
    insertFile({ uuid: 'deletedFile', folderUuid: 'root', status: 'DELETED' });
    // When
    const { data } = getSubtree({ ...props, onlyExists: true });
    // Then
    expect(uuids(data?.folders)).toStrictEqual(['a']);
    expect(uuids(data?.files)).toStrictEqual(['existing']);
  });

  it('does not return items of another user or workspace', () => {
    // Given
    insertFolder({ uuid: 'otherUser', parentUuid: 'root', userUuid: 'userUuid2' });
    insertFolder({ uuid: 'otherWorkspace', parentUuid: 'root', workspaceId: 'workspaceId2' });
    insertFile({ uuid: 'otherUserFile', folderUuid: 'root', userUuid: 'userUuid2' });
    insertFile({ uuid: 'otherWorkspaceFile', folderUuid: 'root', workspaceId: 'workspaceId2' });
    // When
    const { data } = getSubtree(props);
    // Then
    expect(data).toStrictEqual({ files: [], folders: [] });
  });

  it('returns UNKNOWN when error is thrown', () => {
    // Given
    props.userUuid = (() => null) as any;
    // When
    const { error } = getSubtree(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ error: { message: expect.stringContaining('cannot be bound') } });
  });
});
