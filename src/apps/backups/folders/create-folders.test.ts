import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createFolders } from './create-folders';
import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { v4 } from 'uuid';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Sync } from '@/backend/features/sync';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { tracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';

describe('create-folders', () => {
  const createFolderMock = partialSpyOn(Sync.Actions, 'createFolder');

  const rootUuid = v4() as FolderUuid;
  const rootPath = abs('/backup');

  let props: Parameters<typeof createFolders>[0];

  beforeEach(() => {
    tracker.reset();

    props = mockProps<typeof createFolders>({
      ctx: { abortController: new AbortController() },
      tree: { folders: new Map([[rootPath, { uuid: rootUuid, absolutePath: rootPath }]]) },
      added: [join(rootPath, 'folder')],
    });
  });

  it('should do nothing if signal is aborted', async () => {
    // Given
    props.ctx.abortController.abort();
    // When
    await createFolders(props);
    // Then
    calls(createFolderMock).toHaveLength(0);
  });

  it('should increase backed if parent is not found', async () => {
    // Given
    props.tree.folders = new Map();
    // When
    await createFolders(props);
    // Then
    expect(tracker.current.processed).toBe(1);
  });

  it('should increase backed if there is an error', async () => {
    // Given
    createFolderMock.mockRejectedValue(new Error());
    // When
    await createFolders(props);
    // Then
    expect(tracker.current.processed).toBe(1);
    calls(loggerMock.error).toHaveLength(1);
  });

  it('should add folder to the tree if it is created', async () => {
    // Given
    createFolderMock.mockResolvedValueOnce({});
    // When
    await createFolders(props);
    // Then
    expect(tracker.current.processed).toBe(1);
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
    expect(tracker.current.processed).toBe(7);
    calls(createFolderMock).toMatchObject([
      { path: '/backup/folder1' },
      { path: '/backup/folder1/folder2' },
      { path: '/backup/folder3' },
      { path: '/backup/folder3/folder4' },
      { path: '/backup/folder5' },
    ]);
  });
});
