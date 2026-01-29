import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { createFiles } from './create-files';
import { abs, dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Sync } from '@/backend/features/sync';
import * as scheduleRequest from '../schedule-request';

describe('create-files', () => {
  const scheduleRequestMock = partialSpyOn(scheduleRequest, 'scheduleRequest');
  const createFileMock = partialSpyOn(Sync.Actions, 'createFile');

  const path = abs('/parent/file.txt');
  const parentPath = dirname(path);

  let props: Parameters<typeof createFiles>[0];

  beforeEach(() => {
    scheduleRequestMock.mockImplementation(async ({ fn }) => {
      await fn();
    });

    props = mockProps<typeof createFiles>({
      remoteTree: { folders: new Map([[parentPath, { uuid: 'parentUuid' as FolderUuid }]]) },
      added: [{ path, stats: { size: 1024 } }],
    });
  });

  it('should log if there is an error', async () => {
    // Given
    scheduleRequestMock.mockRejectedValue(new Error());
    // When
    await createFiles(props);
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error creating file' });
  });

  it('should ignore if parent is not found', async () => {
    // Given
    props.remoteTree.folders = new Map();
    // When
    await createFiles(props);
    // Then
    calls(createFileMock).toHaveLength(0);
  });

  it('should create file if parent is found', async () => {
    // Given
    createFileMock.mockResolvedValue({});
    // When
    await createFiles(props);
    // Then
    call(createFileMock).toMatchObject({ parentUuid: 'parentUuid', path: '/parent/file.txt' });
  });
});
