import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createFolders } from './create-folders';
import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { v4 } from 'uuid';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Sync } from '@/backend/features/sync';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import * as scheduleRequest from '../schedule-request';

describe('create-folders', () => {
  const scheduleRequestMock = partialSpyOn(scheduleRequest, 'scheduleRequest');
  const createFolderMock = partialSpyOn(Sync.Actions, 'createFolder');

  const rootUuid = v4() as FolderUuid;
  const rootPath = abs('/backup');

  let props: Parameters<typeof createFolders>[0];

  beforeEach(() => {
    scheduleRequestMock.mockImplementation(async ({ fn }) => {
      await fn();
    });

    props = mockProps<typeof createFolders>({
      tree: { folders: new Map([[rootPath, { uuid: rootUuid, absolutePath: rootPath }]]) },
      added: [join(rootPath, 'folder')],
    });
  });

  it('should log if there is an error', async () => {
    // Given
    scheduleRequestMock.mockRejectedValue(new Error());
    // When
    await createFolders(props);
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error creating folder' });
  });

  it('should ignore if parent is not found', async () => {
    // Given
    props.tree.folders = new Map();
    // When
    await createFolders(props);
    // Then
    calls(createFolderMock).toHaveLength(0);
  });

  it('should ignore if folder cannot be created', async () => {
    // Given
    createFolderMock.mockResolvedValue(undefined);
    // When
    await createFolders(props);
    // Then
    expect(props.tree.folders.size).toBe(1);
  });

  it('should add folder to the tree if it is created', async () => {
    // Given
    createFolderMock.mockResolvedValue({});
    // When
    await createFolders(props);
    // Then
    call(createFolderMock).toMatchObject({ parentUuid: rootUuid, path: '/backup/folder' });
    expect(props.tree.folders.size).toBe(2);
  });

  it('should sort folders before processing them', async () => {
    // Given
    createFolderMock.mockResolvedValue({});
    props.added = [
      join(rootPath, '/folder1'),
      join(rootPath, '/folder1/folder2'),
      join(rootPath, '/folder3/folder4'),
      join(rootPath, '/folder3'),
      rootPath,
      join(rootPath, '/folder5'),
      join(rootPath, '/folder6/folder7'),
    ];
    // When
    await createFolders(props);
    // Then
    calls(createFolderMock).toMatchObject([
      { path: '/backup/folder1' },
      { path: '/backup/folder1/folder2' },
      { path: '/backup/folder3' },
      { path: '/backup/folder3/folder4' },
      { path: '/backup/folder5' },
    ]);
  });
});
