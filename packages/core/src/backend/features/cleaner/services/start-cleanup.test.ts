import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';

import { cleanerStore } from '../stores/cleaner.store';
import * as getAllItemsToDeleteModule from '../utils/get-all-items-to-delete';
import * as deleteFileSafelyModule from './delete-file-saftly';
import { startCleanup } from './start-cleanup';

const mockedGetAllItemsToDelete = partialSpyOn(getAllItemsToDeleteModule, 'getAllItemsToDelete');
const mockedDeleteFileSafely = partialSpyOn(deleteFileSafelyModule, 'deleteFileSafely');

describe('startCleanup', () => {
  const mockEmitProgress = vi.fn();

  let props: Parameters<typeof startCleanup>[0];

  beforeEach(() => {
    cleanerStore.reset();

    props = mockProps<typeof startCleanup>({
      cleanerSectionKeys: ['appCache', 'logFiles'],
      viewModel: {
        appCache: { selectedAll: true, exceptions: [] },
        logFiles: { selectedAll: true, exceptions: [] },
      },
      storedCleanerReport: {
        appCache: {
          totalSizeInBytes: 1000,
          items: [{ fullPath: '/cache/file1.tmp', fileName: 'file1.tmp', sizeInBytes: 400 }],
        },
        logFiles: {
          totalSizeInBytes: 500,
          items: [{ fullPath: '/logs/app.log', fileName: 'app.log', sizeInBytes: 300 }],
        },
      },
      emitProgress: mockEmitProgress,
    });
  });

  it('should complete cleanup process successfully', async () => {
    // Given
    const mockItemsToDelete = [
      { fullPath: '/cache/file1.tmp', fileName: 'file1.tmp', sizeInBytes: 400, absolutePath: '/cache/file1.tmp' },
      { fullPath: '/logs/app.log', fileName: 'app.log', sizeInBytes: 300, absolutePath: '/logs/app.log' },
    ];
    mockedGetAllItemsToDelete.mockReturnValue(mockItemsToDelete);
    mockedDeleteFileSafely
      .mockImplementationOnce(async () => {
        await Promise.resolve();
        cleanerStore.state.deletedFilesCount++;
        cleanerStore.state.totalSpaceGained += 400;
      })
      .mockImplementationOnce(async () => {
        await Promise.resolve();
        cleanerStore.state.deletedFilesCount++;
        cleanerStore.state.totalSpaceGained += 300;
      });
    // When
    await startCleanup(props);
    // Then
    expect(mockedGetAllItemsToDelete).toHaveBeenCalledWith({
      viewModel: props.viewModel,
      report: props.storedCleanerReport,
      cleanerSectionKeys: props.cleanerSectionKeys,
    });
    calls(mockedDeleteFileSafely).toHaveLength(2);
    expect(mockedDeleteFileSafely).toHaveBeenCalledWith({ absolutePath: '/cache/file1.tmp' });
    expect(mockedDeleteFileSafely).toHaveBeenCalledWith({ absolutePath: '/logs/app.log' });
    calls(mockEmitProgress).toMatchObject([
      {
        currentCleaningPath: '',
        progress: 0,
        deletedFiles: 0,
        spaceGained: 0,
        cleaning: true,
        cleaningCompleted: false,
      },
      {
        currentCleaningPath: 'file1.tmp',
        progress: 50,
        deletedFiles: 1,
        spaceGained: 400,
        cleaning: true,
        cleaningCompleted: false,
      },
      {
        currentCleaningPath: 'app.log',
        progress: 100,
        deletedFiles: 2,
        spaceGained: 700,
        cleaning: true,
        cleaningCompleted: false,
      },
      {
        currentCleaningPath: '',
        progress: 100,
        deletedFiles: 2,
        spaceGained: 700,
        cleaning: false,
        cleaningCompleted: true,
      },
    ]);

    calls(loggerMock.debug).toMatchObject([
      {
        tag: 'CLEANER',
        msg: 'Starting cleanup process',
        totalFiles: 2,
      },
      {
        tag: 'CLEANER',
        msg: 'Cleanup process finished',
        deletedFiles: 2,
        totalFiles: 2,
      },
    ]);
  });

  it('should handle partial deletion failures', async () => {
    // Given
    const mockItemsToDelete = [
      { fullPath: '/cache/file1.tmp', fileName: 'file1.tmp', sizeInBytes: 400, absolutePath: '/cache/file1.tmp' },
      { fullPath: '/logs/app.log', fileName: 'app.log', sizeInBytes: 300, absolutePath: '/logs/app.log' },
    ];
    mockedGetAllItemsToDelete.mockReturnValue(mockItemsToDelete);
    mockedDeleteFileSafely.mockImplementationOnce(async () => {
      await Promise.resolve();
      cleanerStore.state.deletedFilesCount++;
      cleanerStore.state.totalSpaceGained += 400;
    });
    // When
    await startCleanup(props);
    // Then
    calls(mockedDeleteFileSafely).toHaveLength(2);
    expect(mockEmitProgress).toBeCalledWith({
      currentCleaningPath: '',
      progress: 100,
      deletedFiles: 1,
      spaceGained: 400,
      cleaning: false,
      cleaningCompleted: true,
    });
  });

  it('should handle empty items to delete list', async () => {
    // Given
    mockedGetAllItemsToDelete.mockReturnValue([]);
    // When
    await startCleanup(props);
    // Then
    expect(mockedDeleteFileSafely).not.toBeCalled();
    expect(mockEmitProgress).toBeCalledWith({
      currentCleaningPath: '',
      progress: 100,
      deletedFiles: 0,
      spaceGained: 0,
      cleaning: false,
      cleaningCompleted: true,
    });
  });

  it('should prevent concurrent cleanup processes', async () => {
    // Given
    const mockItemsToDelete = [{ fullPath: '/cache/file1.tmp', fileName: 'file1.tmp', sizeInBytes: 400, absolutePath: '/cache/file1.tmp' }];
    mockedGetAllItemsToDelete.mockReturnValue(mockItemsToDelete);
    mockedDeleteFileSafely.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      cleanerStore.state.deletedFilesCount++;
      cleanerStore.state.totalSpaceGained += 400;
    });
    const newCleanup = startCleanup(props);
    // When
    await startCleanup(props);
    await newCleanup;
    // Then
    expect(loggerMock.warn).toHaveBeenCalledWith({
      tag: 'CLEANER',
      msg: 'Cleanup already in progress, ignoring new request',
    });
  });
});
