import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { GetFileInfoError } from '@/infra/node-win/services/get-file-info';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as createFile from './create-file';
import { createPendingFiles } from './create-pending-files';

describe('create-pending-files', () => {
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const createFileMock = partialSpyOn(createFile, 'createFile');

  const path = abs('/file.txt');

  function createProps({ files = [{ path }], abortController = new AbortController() } = {}) {
    return mockProps<typeof createPendingFiles>({ ctx: { abortController }, files });
  }

  it('should ignore if the file is already a placeholder', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    const props = createProps();
    // When
    await createPendingFiles(props);
    // Then
    calls(createFileMock).toHaveLength(0);
  });

  it('should create file if it is not a placeholder', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({ error: new GetFileInfoError('NOT_A_PLACEHOLDER') });
    const props = createProps();
    // When
    await createPendingFiles(props);
    // Then
    call(createFileMock).toMatchObject({ path });
  });

  it('should log other errors', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({ error: new GetFileInfoError('UNKNOWN') });
    const props = createProps();
    // When
    await createPendingFiles(props);
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error getting file info' });
    calls(createFileMock).toHaveLength(0);
  });

  it('should process every file concurrently', async () => {
    // Given
    const files = Array.from({ length: 5 }, (_, index) => ({ path: abs(`/file-${index}.txt`) }));
    const releases: Array<() => void> = [];
    let activeOperations = 0;
    let maxActiveOperations = 0;

    getFileInfoMock.mockImplementation(async () => {
      activeOperations += 1;
      maxActiveOperations = Math.max(maxActiveOperations, activeOperations);

      await new Promise<void>((resolve) => releases.push(resolve));

      activeOperations -= 1;
      return { data: { uuid: 'uuid' as FileUuid } };
    });

    const processing = createPendingFiles(createProps({ files }));

    await vi.waitFor(() => expect(releases).toHaveLength(4));
    expect(maxActiveOperations).toBe(4);

    releases.splice(0).forEach((release) => release());
    await vi.waitFor(() => expect(releases).toHaveLength(1));
    releases.splice(0).forEach((release) => release());

    // When
    await processing;

    // Then
    expect(getFileInfoMock).toHaveBeenCalledTimes(files.length);
    expect(maxActiveOperations).toBe(4);
  });

  it('should stop taking files when aborted', async () => {
    // Given
    const abortController = new AbortController();
    abortController.abort();
    const props = createProps({ abortController });

    // When
    await createPendingFiles(props);

    // Then
    calls(getFileInfoMock).toHaveLength(0);
  });
});
