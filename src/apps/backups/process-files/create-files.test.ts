import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as util from '@/apps/main/util';
import { Sync } from '@/backend/features/sync';
import { abs, dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerFn } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as scheduleRequest from '../schedule-request';
import { createFiles } from './create-files';

describe('create-files', () => {
  const scheduleRequestMock = partialSpyOn(scheduleRequest, 'scheduleRequest');
  const createFileMock = partialSpyOn(Sync.Actions, 'createFile');
  const sleepMock = partialSpyOn(util, 'sleep');

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
    call(loggerFn).toMatchObject([{ msg: 'Error creating file' }, {}]);
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

  it('should retry a file at the end of the list when its upload can be retried later', async () => {
    // Given
    const otherPath = abs('/parent/other.txt');
    props.added = [...props.added, { path: otherPath, stats: { size: 1024 } }] as typeof props.added;
    createFileMock.mockImplementationOnce(({ retryLater }) => {
      retryLater({ attempt: 2, delayMs: 5000 });
      return Promise.resolve(undefined);
    });
    // When
    await createFiles(props);
    // Then
    calls(createFileMock).toMatchObject([
      { path, attempt: 1 },
      { path: otherPath, attempt: 1 },
      { path, attempt: 2 },
    ]);
    expect(sleepMock.mock.calls[0][0]).toBeGreaterThan(4000);
  });

  it('should count a file as processed only once it is not going to be retried', async () => {
    // Given
    const willRetry: (boolean | undefined)[] = [];
    scheduleRequestMock.mockImplementation(async ({ fn, willRetry: isRetried }) => {
      await fn();
      willRetry.push(isRetried?.());
    });

    createFileMock.mockImplementationOnce(({ retryLater }) => {
      retryLater({ attempt: 2, delayMs: 0 });
      return Promise.resolve(undefined);
    });
    // When
    await createFiles(props);
    // Then
    expect(willRetry).toStrictEqual([true, false]);
  });
});
