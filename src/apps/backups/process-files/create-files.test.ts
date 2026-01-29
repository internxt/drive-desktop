import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { createFiles } from './create-files';
import { abs, dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Sync } from '@/backend/features/sync';
import { tracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';

describe('create-files', () => {
  const createFileMock = partialSpyOn(Sync.Actions, 'createFile');

  const path = abs('/parent/file.txt');
  const parentPath = dirname(path);

  let props: Parameters<typeof createFiles>[0];

  beforeEach(() => {
    tracker.reset();

    props = mockProps<typeof createFiles>({
      remoteTree: { folders: new Map([[parentPath, { uuid: 'parentUuid' as FolderUuid }]]) },
      added: [{ path, stats: { size: 1024 } }],
    });
  });

  it('should increase backed if parent is not found', async () => {
    // Given
    props.remoteTree.folders = new Map();
    // When
    await createFiles(props);
    // Then
    expect(tracker.current.processed).toBe(1);
  });

  it('should increase backed if there is an error', async () => {
    // Given
    createFileMock.mockRejectedValue(new Error());
    // When
    await createFiles(props);
    // Then
    expect(tracker.current.processed).toBe(1);
    calls(loggerMock.error).toHaveLength(1);
  });

  it('should increase backed if file is created', async () => {
    // Given
    createFileMock.mockResolvedValue({});
    // When
    await createFiles(props);
    // Then
    expect(tracker.current.processed).toBe(1);
  });
});
